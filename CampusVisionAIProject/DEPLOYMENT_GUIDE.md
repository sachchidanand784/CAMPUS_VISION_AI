# PythonAnywhere Deployment Guide

This guide describes how to deploy the CampusVisionAI project on PythonAnywhere using the standard WSGI hosting environment.

---

## Step 1: Package the Project Locally

We have provided a script `bundle_for_pythonanywhere.py` in the project root. This script automatically builds the React frontend for production with relative API endpoints, filters out unnecessary developer directories (`node_modules`, `venv`, databases, caches, git files), and packages the app into a tiny zip archive.

1. Open a terminal/command prompt at the project root (`CampusVisionAIProject`).
2. Run the packaging script:
   ```bash
   python bundle_for_pythonanywhere.py
   ```
3. A file named `campusvisionai_deploy.zip` (~2-3 MB) will be created.

---

## Step 2: Upload and Extract on PythonAnywhere

1. Log in to your **PythonAnywhere** account.
2. Go to the **Files** tab on your dashboard.
3. Upload `campusvisionai_deploy.zip` to your home directory (`/home/<your-username>/`).
4. Click on the **Consoles** tab and open a new **Bash** console.
5. Extract the uploaded zip file into a new folder named `CampusVisionAI`:
   ```bash
   unzip ~/campusvisionai_deploy.zip -d ~/CampusVisionAI
   ```

---

## Step 3: Create a Virtual Environment

In your PythonAnywhere Bash console, create a virtual environment to manage dependencies:

1. Create a Python 3.10 virtual environment:
   ```bash
   mkvirtualenv campus_venv --python=python3.10
   ```
   *(Note: This command will automatically activate the environment. If it doesn't, activate it using `workon campus_venv`)*.

2. Install the backend dependencies:
   ```bash
   pip install -r ~/CampusVisionAI/BACKEND/requirements.txt
   ```

---

## Step 4: Configure the Web App on PythonAnywhere

1. Go to the **Web** tab on the PythonAnywhere dashboard.
2. Click **Add a new web app**.
3. When prompted, select **Manual Configuration** (do NOT choose Django, Flask, or web2py, as we are manually adapting FastAPI via WSGI).
4. Select **Python 3.10** as the version.
5. Once the Web App page loads, configure the following sections:

### Code Section:
* **Source code**: `/home/<your-username>/CampusVisionAI/BACKEND`
* **Working directory**: `/home/<your-username>/CampusVisionAI/BACKEND`
* **WSGI configuration file**: Click the link to edit the configuration file. **Delete all existing contents** and replace them with the code below:

```python
import sys
import os

# Define the backend folder path
project_home = '/home/<your-username>/CampusVisionAI/BACKEND'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load the WSGI adapter
from wsgi import application
```
*(Be sure to replace `<your-username>` with your actual PythonAnywhere username, then click **Save**).*

### Virtualenv Section:
* **Path**: `/home/<your-username>/.virtualenvs/campus_venv`
*(PythonAnywhere should automatically recognize it once you enter this path).*

---

## Step 5: Configure Environment Variables

1. Go back to the **Files** tab and navigate to `/home/<your-username>/CampusVisionAI/BACKEND/`.
2. Create or upload a `.env` file containing your production variables:
   ```env
   # Database connection (Use SQLite by default, or connect a Postgres/MySQL database)
   # DATABASE_URL=sqlite:///./sql_app.db
   
   SECRET_KEY=your_generated_secret_key
   
   # SMTP config for emailing attendance alerts
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_smtp_app_password
   SMTP_FROM=your_email@gmail.com
   SMTP_PORT=587
   SMTP_USE_TLS=true
   ```

---

## Step 6: Reload and Launch!

1. Return to the **Web** tab.
2. Click the green **Reload <your-username>.pythonanywhere.com** button at the top.
3. Access your site at `http://<your-username>.pythonanywhere.com/`.

---

## Managing Database migrations or Admin Resets
If you need to reset the admin password or run schema fixes on PythonAnywhere:
1. Open a Bash console.
2. Activate your virtual environment: `workon campus_venv`
3. Navigate to the backend directory: `cd ~/CampusVisionAI/BACKEND`
4. Run the desired utility script, e.g.:
   ```bash
   python reset_admin.py
   ```
