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

				#Nodejs
				pkgs.nodejs_20

				pkgs.git
			];

			shellHook = ''
			  echo "Entering Flax-10 wonderland..."

			if [ ! -d /flax-10-project-files/venv ]; then 
				echo "Running for the first time, creating venv with necessary packages and deploying Node toolchain..."
				python -m venv /flax-10-project-files/venv
				source /flax-10-project-files/venv/bin/activate
				
				cd /work
				pip install -r requirements.txt
				
				cd flax-10-project-files/frontend
				if [ ! -d package.json ]; then
					echo "Frontend dorectory empty. Rebuilding template..."
					npm create vite@latest . -- --template react
					npm install
				fi
				
				npm ci
				
			fi
			
			echo "Python: $(python --version)"
			echo "NodeJS: $(node --version)"
			
			cd /work/flax-10-project-files
			echo "Venv: $VIRTUAL_ENV"
			'';
		};
	};
}
