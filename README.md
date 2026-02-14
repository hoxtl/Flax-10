# Team *Flax-10* Major Group Project (StudyFlax)

## Project topic
Academic - Time management system for students in higher education

## Team members
The members of the team are:
- *Aishah Ahmed*
- *Eric Almeida*
- *Zerun (Harry) Chen*
- *Cate Tay (Cate) Chew*
- *Indixora Jozal*
- *Kausar Khan*
- *Hamed Latif*
- *Dian Mahmood*
- *Binuli Nevanma Markawitage*

## Project structure
The project is called `StudyFlax`.  It currently consists of: 

## Deployed version of the application
The deployed version of the application can be found at [*INSERT LINK*].

## Installation instructions

(Installation of Nix is assumed for the following instruction. If not please access https://nixos.org/download/#download-nix for instructions.)

**Setup the Nix Development Environment(Linux/MacOS)**
- cd Your current directory to .../Flax-10
- Copy and run the following command:

```
$ nix --extra-experimental-features 'nix-command flakes' develop -c bash
```
- Note that you can configure these experimental-features to be turned on permanently through ```/etc/nix/nix.conf``` by adding ```experimental-features 'nix-command flakes'``` .
- Now the flake script will automatically configure the venv and npm environment.
- After the script executed, you will end up returning to the bash terminal. Activate venv or run npm dev within Nix as you wish!

**Setup the Nix Development Environment(Windows)**
- This walkthrough will be using Docker for setting up Nix, and this instruction will follow this idea. You are much welcomed using WSL and following the Linux/MacOS instructions above.
- Open your Docker Desktop and find the Docker Desktop Terminal.
- Inside the terminal, cd to your Flax-10 repository folder, and then execute the following commands:

```
docker volume create nix-store
```

then,

```
docker run --rm -it `
	-v "${PWD}:/work" `
	-v nix-store:/nix `
	-w /work `
	nixos/nix:latest
```
(If this does not work, try this signle-line concatenated version of dock run command):

```
docker run --rm -it -v "${PWD}:/work" -v nix-store:/nix -w /work nixos/nix:latest
```

and then,

```
git -C "/work" add "flake.nix"
```

finally,

```
nix --extra-experimental-features 'nix-command flakes' develop -c bash
```

- Notice now you have entered the NixOS container, which is created by the command ```docker run```  above from the official NixOS image repository held by Docker. You also set up a volume where all the nix related files will be stored(```/nix```).
- Inside the NixOS terminal interface within your Nix environment, feel free activate your venv or run npm dev!

**Setup the local PostgreSQL database server**
- After installing postgresql release, open the psql terminal.
- There will be prompted connection detail provided by psql in the form of ```Server [localhost]```, ```Database [postgres]```, etc, and it is sufficient for setting up a test server. So we keep pressing enter until the terminal asks you for a password for the user with name specified by ```USERNAME[your username]```, by default it is postgres.
- Django ```settings.py``` is configured to be compatible with these default parameters, however you will need your password offered to the psql terminal to replace the password specified in the ```settings.py```. By default it is 1234.
- Now you should have a PostgreSQL server running in the background. Have fun ```python manage.py migrate``` your django project!

**Nix Terminal Post Installation Access Notification**

- Each time after installation would you want to access nix shell again, run

```
nix --extra-experimental-features 'nix-command flakes' develop -c bash
```

at your repository directory.

For docker users, you will need to run the ```docker run...``` command mentioned above, as the container is set to self-destructive after exit by ```--rm```.

## Sources
- Mention any external sources / AI generated code

**Package Management Software**

| Package   | Version | Purpose            |
| --------- | ------- | ------------------ |
| Nix	    | 2.33.2  | Enviromental package management      |
| npm	    | 10.8.2  | JavaScript package management |

**Frontend Packages**

- Runtime Dependencies

| Package   | Version | Purpose            |
| --------- | ------- | ------------------ |
| react     | 19.2.0  | UI library         |
| react-dom | 19.2.0  | React DOM renderer |

- Development Dependencies

| Package                     | Version | Purpose                            |
| --------------------------- | ------- | ---------------------------------- |
| vite                        | 7.2.4   | Frontend build tool & dev server   |
| @vitejs/plugin-react        | 5.1.1   | React fast-refresh & JSX support   |
| eslint                      | 9.39.1  | JavaScript/TypeScript linter       |
| @eslint/js                  | 9.39.1  | Core ESLint rule definitions       |
| eslint-plugin-react-hooks   | 7.0.1   | React Hooks linting rules          |
| eslint-plugin-react-refresh | 0.4.24  | Fast-refresh linting support       |
| globals                     | 16.5.0  | Shared global variable definitions |
| @types/react                | 19.2.5  | TypeScript typings for React       |
| @types/react-dom            | 19.2.3  | TypeScript typings for React DOM   |

**Backend Packages**

| Package             | Version | Purpose                                         |
| ------------------- | ------- | ----------------------------------------------- |
| Django              | 5.2.0   | Web framework                                   |
| djangorestframework | 3.16.1  | REST API framework for Django                   |
| psycopg             | 3.3.2   | PostgreSQL driver (modern async-capable core)   |
| psycopg-binary      | 3.3.2   | Precompiled psycopg binaries for local/dev use  |
| asgiref             | 3.11.1  | ASGI utilities used by Django                   |
| sqlparse            | 0.5.5   | SQL parsing & formatting (used by Django ORM)   |
| virtualenv          | 20.36.1 | Isolated Python environment creation            |
| distlib             | 0.4.0   | Dependency utility library (virtualenv backend) |
| filelock            | 3.20.1  | Cross-platform file locking                     |
| platformdirs        | 4.5.0   | OS-specific directory resolution                |
