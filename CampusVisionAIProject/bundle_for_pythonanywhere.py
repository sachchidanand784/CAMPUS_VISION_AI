import os
import shutil
import zipfile
import subprocess
import sys

def build_frontend():
    frontend_dir = os.path.join(os.path.dirname(__file__), "FRONTEND")
    if not os.path.exists(frontend_dir):
        print("[-] FRONTEND directory not found!")
        return False
    
    print("[*] Checking node_modules...")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("[*] Installing frontend dependencies (npm install)...")
        try:
            subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"[-] npm install failed: {e}")
            print("[-] Please ensure Node.js and npm are installed and run 'npm install' manually inside the FRONTEND folder.")
            return False

    print("[*] Building frontend for production (npm run build) with VITE_API_URL=''...")
    env = os.environ.copy()
    env["VITE_API_URL"] = ""
    try:
        subprocess.run("npm run build", cwd=frontend_dir, env=env, shell=True, check=True)
        print("[+] Frontend build successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[-] npm run build failed: {e}")
        print("[-] Please run 'npm run build' manually inside the FRONTEND folder with VITE_API_URL set to empty.")
        return False

def zip_project(output_filename="campusvisionai_deploy.zip"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(base_dir, output_filename)
    
    # Files/folders to explicitly include
    include_paths = {
        "BACKEND": "BACKEND",
        "FRONTEND/dist": "FRONTEND/dist",
        "README.md": "README.md",
        "DEPLOYMENT_GUIDE.md": "DEPLOYMENT_GUIDE.md"
    }

    # Patterns or folder names to exclude inside included folders
    exclude_dirs = {"venv", "__pycache__", "node_modules", ".git"}
    exclude_files = {"sql_app.db", ".env"}

    print(f"[*] Packaging project into {output_filename}...")
    
    # Remove old zip if exists
    if os.path.exists(zip_path):
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for rel_src, rel_dst in include_paths.items():
            src_full = os.path.join(base_dir, rel_src.replace("/", os.sep))
            if not os.path.exists(src_full):
                if rel_src == "FRONTEND/dist":
                    print(f"[-] Warning: {rel_src} not found! Did you build the frontend?")
                else:
                    print(f"[-] Warning: {rel_src} not found, skipping...")
                continue

            if os.path.isdir(src_full):
                for root, dirs, files in os.walk(src_full):
                    # Filter out excluded directories in place
                    dirs[:] = [d for d in dirs if d not in exclude_dirs]
                    
                    for file in files:
                        if file in exclude_files or file.endswith(".pyc") or file.endswith(".log"):
                            continue
                        
                        file_path = os.path.join(root, file)
                        # Compute path inside zip file
                        rel_path_in_dir = os.path.relpath(file_path, src_full)
                        arcname = os.path.join(rel_dst, rel_path_in_dir)
                        zipf.write(file_path, arcname)
            else:
                zipf.write(src_full, rel_dst)

    print(f"[+] Successfully bundled into {zip_path} ({os.path.getsize(zip_path) / 1024 / 1024:.2f} MB)")
    print("[+] Ready for upload to PythonAnywhere!")

if __name__ == "__main__":
    print("=========================================")
    print("CampusVisionAI PythonAnywhere Bundler")
    print("=========================================")
    
    # Try to build frontend
    built = build_frontend()
    if not built:
        print("[!] Frontend compilation skipped or failed. Packaging current files anyway...")
    
    zip_project()
