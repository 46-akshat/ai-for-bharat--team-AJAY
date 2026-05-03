import csv
import os
import glob
import trie_module

def run(directory_path="./data"):
    finalGSTList = []
    
    # Match any CSV file starting with 'norm_' in the specified directory
    search_pattern = os.path.join(directory_path, 'norm_*.csv')
    
    for filepath in glob.glob(search_pattern):
        with open(filepath, mode='r') as file:
            reader = csv.reader(file)
            try:
                header = next(reader)
                for row in reader:
                    if len(row) > 5:
                        templist =[]
                        templist.append(row[0])
                        templist.append(row[5])
                        finalGSTList.append(templist)
            except StopIteration:
                pass # Skip if file is completely empty

    count = 0
    for gst in finalGSTList:
        if(len(gst) > 0):
            count += 1
    print(count)
    
    # Hand off data to C++ trie matching module
    candidate_pairs = trie_module.get_candidate_pairs(finalGSTList)
    print(f"Generated {len(candidate_pairs)} candidate pairs.")
    return candidate_pairs

if __name__ == "__main__":
    candidate_pairs = run()
    for p in candidate_pairs:
        print(p)


