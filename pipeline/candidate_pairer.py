import os
import subprocess

def run():
    input_file = "data/normalized_records.parquet"
    output_file = "data/candidate_pairs.parquet"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found. Run normalize.py first.")
        return
        
    print("Building C++ Native Engine...")
    build_result = subprocess.run(["make", "-C", "cpp_matcher"], capture_output=True, text=True)
    if build_result.returncode != 0:
        print("Error compiling C++ matcher:\n", build_result.stderr)
        return
        
    print(f"Starting candidate generation via C++ Native Engine...")
    exe_path = os.path.join(".", "cpp_matcher", "matcher")
    
    # We pass LD_LIBRARY_PATH so matcher finds libduckdb.so inside cpp_matcher or root
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = os.path.abspath(".") + ":" + os.path.abspath("cpp_matcher")
    
    matcher_result = subprocess.run([exe_path, input_file, output_file], env=env, capture_output=False)
    
    if matcher_result.returncode == 0:
        print("Done!")
    else:
        print("C++ matcher failed.")

if __name__ == "__main__":
    run()
