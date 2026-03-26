{
  description = "A flake for setting up Flax-10 project development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      eachSystem = nixpkgs.lib.genAttrs systems;

      commonScript = ''
        WORK_DIR="$(pwd)"
      '';

    in {

      packages = eachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in {

          # ─── nix run .#init ───────────────────────────────────────────────
          # Installs all dependencies and seeds the database.
          init = pkgs.writeShellApplication {
            name = "init";
            runtimeInputs = with pkgs; [
              python312
              python312Packages.pip
              python312Packages.virtualenv
              nodejs_20
              git
            ];
            text = ''
              ${commonScript}
              VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
              FRONTEND_DIR="$WORK_DIR/flax-10-project-files/frontend"
              BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"

              echo ""
              echo "Entering Flax-10 wonderland..."
              echo ""

              # ── Python virtual environment ──────────────────────────────
              if [ ! -d "$VENV_DIR" ]; then
                echo "Creating virtual environment..."
                python -m venv "$VENV_DIR"
              fi

              # shellcheck disable=SC1091
              source "$VENV_DIR/bin/activate"
              echo "Installing Python dependencies..."
              pip install -r "$WORK_DIR/requirements.txt" --quiet

              # ── Frontend dependencies ───────────────────────────────────
              echo "Installing frontend dependencies..."
              cd "$FRONTEND_DIR"
              npm ci --silent

              # ── Database setup and seeding ──────────────────────────────
              echo "Running database migrations..."
              cd "$BACKEND_DIR"
              if python manage.py shell -c '
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        ["studyFlax_society", "location"],
    )
    print("present" if cursor.fetchone() else "missing")
' | grep -qx "present" && ! python manage.py showmigrations studyFlax | grep -Fq "[X] 0022_society_location"; then
                echo "Society location column already exists; faking studyFlax.0022_society_location..."
                python manage.py migrate studyFlax 0022_society_location --fake --noinput
              fi
              python manage.py migrate --noinput

              echo "Seeding database..."
              python manage.py seed

              echo ""
              echo "Init complete."
              echo ""
              echo "Next steps:"
              echo "  nix run .#run    - Start the development servers"
              echo "  nix run .#tests  - Run all tests and generate coverage"
            '';
          };

          # ─── nix run .#run ────────────────────────────────────────────────
          # Starts the backend and frontend development servers.
          run = pkgs.writeShellApplication {
            name = "run";
            runtimeInputs = with pkgs; [
              python312
              nodejs_20
            ];
            text = ''
              ${commonScript}
              VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
              FRONTEND_DIR="$WORK_DIR/flax-10-project-files/frontend"
              BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"

              # shellcheck disable=SC1091
              source "$VENV_DIR/bin/activate"

              pick_port() {
                python - "$1" <<'PY'
import socket
import sys

start = int(sys.argv[1])
for port in range(start, start + 100):
    with socket.socket() as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            continue
        print(port)
        break
else:
    raise SystemExit(f"No free port found starting at {start}")
PY
              }

              BACKEND_PORT="$(pick_port 8000)"
              FRONTEND_PORT="$(pick_port 5173)"

              cleanup() {
                [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
                [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
              }
              trap cleanup EXIT INT TERM

              echo ""
              echo "Starting Flax-10 development servers..."
              echo ""

              cd "$BACKEND_DIR"
              python manage.py runserver "127.0.0.1:$BACKEND_PORT" &
              BACKEND_PID=$!

              cd "$FRONTEND_DIR"
              npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" &
              FRONTEND_PID=$!

              echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
              echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
              echo ""
              echo "Press Ctrl+C to stop both servers."

              wait $BACKEND_PID $FRONTEND_PID
            '';
          };

          # ─── nix run .#tests ──────────────────────────────────────────────
          # Runs all automated tests and generates coverage reports.
          # Reports are written to ./coverage/backend/ and ./coverage/frontend/
          tests = pkgs.writeShellApplication {
            name = "tests";
            runtimeInputs = with pkgs; [
              python312
              nodejs_20
            ];
            text = ''
              ${commonScript}
              VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
              FRONTEND_DIR="$WORK_DIR/flax-10-project-files/frontend"
              BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"

              # shellcheck disable=SC1091
              source "$VENV_DIR/bin/activate"

              mkdir -p "$WORK_DIR/coverage/backend" "$WORK_DIR/coverage/frontend"

              # ── Backend tests ───────────────────────────────────────────
              echo ""
              echo "Running backend tests..."
              cd "$BACKEND_DIR"
              python -m coverage erase
              python -m coverage run --source=studyFlax manage.py test --verbosity=1
              python -m coverage report -m
              python -m coverage html --directory="$WORK_DIR/coverage/backend/html"
              python -m coverage xml -o "$WORK_DIR/coverage/backend/coverage.xml"

              # ── Frontend tests ──────────────────────────────────────────
              echo ""
              echo "Running frontend tests..."
              cd "$FRONTEND_DIR"
              npm run coverage
              cp -r coverage/. "$WORK_DIR/coverage/frontend/" 2>/dev/null || true

              echo ""
              echo "Coverage reports written to:"
              echo "  ./coverage/backend/html/index.html"
              echo "  ./coverage/backend/coverage.xml"
              echo "  ./coverage/frontend/"
            '';
          };

          # ─── nix run .#unseed ─────────────────────────────────────────────
          # Removes all seed data and allows immediate re-seeding.
          unseed = pkgs.writeShellApplication {
            name = "unseed";
            runtimeInputs = with pkgs; [ python312 ];
            text = ''
              ${commonScript}
              VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
              BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"
              # shellcheck disable=SC1091
              source "$VENV_DIR/bin/activate"
              cd "$BACKEND_DIR"
              printf 'yes\n' | python manage.py unseed
              echo "Seed data removed. Run 'nix run .#init' to re-seed."
            '';
          };

          # ─── nix run .#seed ───────────────────────────────────────────────
          # Seeds the database without full initialisation.
          seed = pkgs.writeShellApplication {
            name = "seed";
            runtimeInputs = with pkgs; [ python312 ];
            text = ''
              ${commonScript}
              VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
              BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"
              # shellcheck disable=SC1091
              source "$VENV_DIR/bin/activate"
              cd "$BACKEND_DIR"
              python manage.py seed
              echo "Database seeded."
            '';
          };

        }
      );

      # ─── nix develop ───────────────────────────────────────────────────────
      devShells = eachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              python312
              python312Packages.pip
              python312Packages.virtualenv
              nodejs_20
              git
            ];
            shellHook = ''
              echo ""
              echo "Flax-10 development environment"
              echo ""
              echo "Available entrypoints:"
              echo "  nix run .#init    - Install dependencies and seed the database"
              echo "  nix run .#run     - Start the development servers"
              echo "  nix run .#tests   - Run all tests and generate coverage reports"
              echo "  nix run .#seed    - Seed the database with sample data"
              echo "  nix run .#unseed  - Remove all seed data"
              echo ""
            '';
          };
        }
      );

    };
}
