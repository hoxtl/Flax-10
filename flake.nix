{
  description = "A flake for setting up Flax-10 project development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
	let
		system = "x86_64-linux";
		pkgs = import nixpkgs {inherit system;};
	in {
		devShells.${system}.default = pkgs.mkShell {
			packages = [
				#Python and venv
				pkgs.python314
				pkgs.python314Packages.pip
				pkgs.python314Packages.virtualenv

				#Nodejs and vite
				pkgs.nodejs_25
				pkgs.vite

				pkgs.git
			];

			shellHook = ''
			  echo "Entering Flax-10 wonderland..."

			if [ ! -d /flax-10-project-files/venv ]; then 
				echo "Running for the first time, creating venv with necessary packages and deploying Node toolchain..."
				python -m venv /flax-10-project-files/venv
				source /flax-10-project-files/venv/bin/activate
				pip install django djangorestframework psycopg[binary]
				cd flax-10-project-files/frontend
				npm install
				
			else
				source /flax-10-project-files/venv/bin/activate
			fi
			
			echo "Python: $(python --version)"
			echo "NodeJS: $(node --version)"
			echo "Venv: $VIRTUAL_ENV"
			'';
		};
	};
}
