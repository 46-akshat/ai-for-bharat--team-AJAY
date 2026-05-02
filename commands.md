# Python Virtual Environment Commands

## Create a virtual environment
- Windows (PowerShell):
  ```powershell
  python -m venv .venv
  ```
- Windows (cmd):
  ```cmd
  python -m venv .venv
  ```
- macOS / Linux:
  ```bash
  python3 -m venv .venv
  ```

## Activate the virtual environment
- Windows (PowerShell):
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- Windows (cmd):
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- macOS / Linux:
  ```bash
  source .venv/bin/activate
  ```

## Deactivate the virtual environment
- All platforms:
  ```bash
  deactivate
  ```

## Install dependencies
- From a `requirements.txt` file:
  ```bash
  pip install -r requirements.txt
  ```

## Freeze installed packages
- Create or update `requirements.txt`:
  ```bash
  pip freeze > requirements.txt
  ```
