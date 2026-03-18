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
  		
  		system_shell_tagging = nixpkgs.lib.genAttrs systems;
  		
  		generate_shell_variant = system:
	  	let
			pkgs = import nixpkgs {inherit system;};
		in
			pkgs.mkShell {
				packages = [
					#Python and venv
					pkgs.python314
					pkgs.python314Packages.pip
					pkgs.python314Packages.virtualenv

					#Nodejs
					pkgs.nodejs_20

					pkgs.git
				];

				shellHook = ''
				  echo "\n"
				  echo "Entering Flax-10 wonderland...\n"
				  echo "...\n"
				  echo "..\n"
				  echo ".\n"
				  echo "\n"
				
				WORK_DIR="$PWD"
				VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
				FRONTEND_DIR="$WORK_DIR/flax-10-project-files/frontend"
				BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"
				
				if [ ! -d "$VENV_DIR" ]; then 
					echo "\n"
					echo "Running for the first time, creating venv with necessary packages and deploying Node toolchain...\n"
					echo "\n"
					python -m venv "$VENV_DIR"
					source "$VENV_DIR/bin/activate"
					
					cd "$WORK_DIR"
					pip install -r requirements.txt
				else
					echo "\n"
					echo "Venv detected...\n"
					echo "\n"
					source "$VENV_DIR/bin/activate"
					pip install -r requirements.txt
				fi
				
				cd "$FRONTEND_DIR"
				if [ ! -f package.json ]; then
					echo "\n"
					echo "Frontend directory empty. Rebuilding template..."
					echo "\n"
					npm create vite@latest . -- --template react
					npm install
				elif [ ! -d node_modules ]; then
					echo "\n"
					echo "Frontend template detected, installing dependencies...\n"
					echo "\n"
					npm install
				else
					echo "\n"
					echo "Frontend template detected, dependencies already installed.\n"
					echo "\n"
				fi
				
				cd "$BACKEND_DIR"
				python manage.py makemigrations --noinput
				python manage.py migrate --noinput
				python manage.py seed
				
				echo "Database migration and seeding accomplished. Starting dev server...\n"
				python manage.py runserver &
				
				echo "Generating backend coverage test report..."
				python -m coverage erase
				python -m coverage run manage.py test
				python -m coverage report -m

				python -m coverage html
				
				cd "$FRONTEND_DIR"
				npm run build
				echo "Starting vite dev server..."
				npm run dev &
				
				echo "Generating frontend coverage report..."
				npm run test -- --run
				npm run coverage
				
				echo "\n"
				echo "Python: $(python --version)"
				echo "NodeJS: $(node --version)"
				echo "Venv: $VIRTUAL_ENV"
				cd "$WORK_DIR"
				echo "\n"
				'';
			};
		in {
	  		devShells = system_shell_tagging (
	  			system: {
	  				default = generate_shell_variant system;
	  			}
	  		);
	  	};
}
