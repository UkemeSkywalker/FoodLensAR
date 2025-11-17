#!/usr/bin/env python3
"""
Packaging script for Food Lens Strands Agent Lambda deployment.
Creates a deployment package with all dependencies for ARM64 architecture.
"""

import os
import sys
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path


def run_command(command, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error output: {e.stderr}")
        raise


def create_lambda_package():
    """Create a Lambda deployment package."""
    
    # Get current directory (lambda directory)
    lambda_dir = Path(__file__).parent
    project_root = lambda_dir.parent
    
    print(f"Lambda directory: {lambda_dir}")
    print(f"Project root: {project_root}")
    
    # Create temporary directory for packaging
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        package_dir = temp_path / "package"
        package_dir.mkdir()
        
        print(f"Temporary package directory: {package_dir}")
        
        # Install dependencies for ARM64 architecture
        print("Installing dependencies for ARM64...")
        requirements_file = lambda_dir / "requirements.txt"
        
        if requirements_file.exists():
            pip_command = f"""
            pip install \
                --target {package_dir} \
                --platform linux_aarch64 \
                --implementation cp \
                --python-version 3.12 \
                --only-binary=:all: \
                --upgrade \
                -r {requirements_file}
            """
            
            try:
                run_command(pip_command)
                print("Dependencies installed successfully")
            except subprocess.CalledProcessError:
                print("Warning: Some dependencies may not be available for ARM64")
                print("Falling back to local architecture...")
                fallback_command = f"pip install --target {package_dir} -r {requirements_file}"
                run_command(fallback_command)
        
        # Copy Lambda function code
        print("Copying Lambda function code...")
        
        # Copy main handler
        shutil.copy2(lambda_dir / "agent_handler.py", package_dir)
        shutil.copy2(lambda_dir / "config.py", package_dir)
        
        # Copy tools directory
        tools_src = lambda_dir / "tools"
        tools_dst = package_dir / "tools"
        if tools_src.exists():
            shutil.copytree(tools_src, tools_dst)
        
        # Create deployment zip
        zip_path = lambda_dir / "deployment-package.zip"
        print(f"Creating deployment package: {zip_path}")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(package_dir):
                for file in files:
                    file_path = Path(root) / file
                    arc_name = file_path.relative_to(package_dir)
                    zipf.write(file_path, arc_name)
        
        # Get package size
        package_size = zip_path.stat().st_size / (1024 * 1024)  # MB
        print(f"Deployment package created: {zip_path}")
        print(f"Package size: {package_size:.2f} MB")
        
        if package_size > 50:
            print("Warning: Package size exceeds 50MB. Consider using Lambda layers.")
        
        return zip_path


def validate_package():
    """Validate the Lambda package contents."""
    zip_path = Path(__file__).parent / "deployment-package.zip"
    
    if not zip_path.exists():
        print("Deployment package not found. Run create_lambda_package() first.")
        return False
    
    print("Validating package contents...")
    
    required_files = [
        "agent_handler.py",
        "config.py",
        "tools/__init__.py",
        "tools/dish_info.py",
        "tools/nutrition_lookup.py",
        "tools/dietary_advice.py"
    ]
    
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        package_files = zipf.namelist()
        
        missing_files = []
        for required_file in required_files:
            if required_file not in package_files:
                missing_files.append(required_file)
        
        if missing_files:
            print(f"Missing required files: {missing_files}")
            return False
        
        # Check for strands dependencies
        has_strands = any("strands" in f.lower() for f in package_files)
        if not has_strands:
            print("Warning: Strands Agents SDK not found in package")
        
        print("Package validation successful")
        print(f"Total files in package: {len(package_files)}")
        
        return True


def main():
    """Main function."""
    if len(sys.argv) > 1 and sys.argv[1] == "validate":
        validate_package()
    else:
        try:
            zip_path = create_lambda_package()
            validate_package()
            
            print("\n" + "="*50)
            print("Lambda package created successfully!")
            print(f"Package location: {zip_path}")
            print("\nNext steps:")
            print("1. Deploy using AWS CDK: cd cdk && cdk deploy")
            print("2. Or upload manually to AWS Lambda console")
            print("3. Set environment variables in Lambda configuration")
            print("="*50)
            
        except Exception as e:
            print(f"Error creating package: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()