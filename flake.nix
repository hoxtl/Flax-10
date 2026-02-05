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
				  echo "Entering Flax-10 wonderland..."
				
				WORK_DIR="$PWD"
				VENV_DIR="$WORK_DIR/flax-10-project-files/venv"
				FRONTEND_DIR="$WORK_DIR/flax-10-project-files/frontend"
				BACKEND_DIR="$WORK_DIR/flax-10-project-files/backend"
				
				if [ ! -d "$VENV_DIR" ]; then 
					echo "Running for the first time, creating venv with necessary packages and deploying Node toolchain..."
					python -m venv "$VENV_DIR"
					source "$VENV_DIR/bin/activate"
					
					cd "$WORK_DIR"
					pip install -r requirements.txt
				else
					echo "Venv detected..."
					source "$VENV_DIR/bin/activate"
				fi
				
				cd "$FRONTEND_DIR"
				if [ ! -f package.json ]; then
					echo "Frontend dorectory empty. Rebuilding template..."
					npm create vite@latest . -- --template react
					npm install
				else
					echo "Frontend template detected..."
					npm ci
				fi
				
				echo "Python: $(python --version)"
				echo "NodeJS: $(node --version)"
				echo "Venv: $VIRTUAL_ENV"
				cd "$WORK_DIR"
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
