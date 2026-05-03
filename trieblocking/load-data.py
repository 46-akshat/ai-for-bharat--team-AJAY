import csv
import os
import glob

def run(directory_path="."):
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
                        # templist.append(row[0])
                        # templist.append(row[5])
                        finalGSTList.append(row[5])
            except StopIteration:
                pass # Skip if file is completely empty

    count = 0
    for gst in finalGSTList:
        if(len(gst) > 0):
            print(gst)
            count += 1
    print(count)
    return finalGSTList

if __name__ == "__main__":
    run()


