#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

#include "duckdb.hpp"

using namespace std;

struct BusinessRecord
{
    int64_t uri;
    string raw_id;
    string pin;
    string pan;
    string gst;
    string phone;
    string biz_name_norm;
    string address_norm;
};

class DSU_SET
{
    vector<int> set_size;
    vector<int> parent;

public:
    DSU_SET(int size) : set_size(size, 1), parent(size)
    {
        for (int i = 0; i < size; i++)
        {
            parent[i] = i;
        }
    }
    void make_set(int v)
    {
        set_size[v] = 1;
        parent[v] = v;
    }

    int find_set(int v)
    {
        if (parent[v] == v)
            return v;
        else
            return parent[v] = find_set(parent[v]);
    }

    void union_sets(int a, int b)
    {
        a = find_set(a);
        b = find_set(b);
        if (a != b)
        {
            if (set_size[a] < set_size[b])
                swap(a, b);

            set_size[a] += set_size[b];
            parent[b] = a;
        }
    }
};

// 26 alpha + 10 digits = 36
class MyTrie
{
    struct TrieNode
    {
        TrieNode *children[37]{};
        int id = -1;
    };

    TrieNode *root;

    int getIndex(char c)
    {
        if (c == ' ')
            return 36;
        else if (c >= 'A' && c <= 'Z')
            return c - 'A';
        else
            return (c - '0') + 26;
    }

    char getCharacter(int idx)
    {
        if (idx >= 0 && idx < 26)
        {
            return (char)('A' + idx);
        }
        else if (idx < 36)
        {
            int offsetIdx = idx - 26;
            return (char)('0' + offsetIdx);
        }
        else
            return ' ';
    }

    void display(TrieNode *curr, string &s)
    {
        if (curr->id != -1)
        {
            cout << s << " : " << (curr->id) << "\n";
        }

        for (int i = 0; i < 37; i++)
        {
            if (curr->children[i] != nullptr)
            {
                char letter = getCharacter(i);
                s.push_back(letter);
                display((curr->children)[i], s);
                s.pop_back();
            }
        }
    }

    void clear(TrieNode *curr)
    {
        if (curr == nullptr)
            return;
        for (int i = 0; i < 37; i++)
            clear(curr->children[i]);
        delete curr;
    }

    void searchFuzzyRecursive(TrieNode *node, const string &target, const vector<int> &prev_row, 
                              int max_dist, int current_id, DSU_SET &cs) {
        
        // 1. Match Condition
        // If this is a terminal node, check the edit distance of the complete path.
        // The distance is always the last element of the state vector.
        if (node->id != -1 && prev_row.back() <= max_dist) {
            cs.union_sets(current_id, node->id);
        }

        // 2. Traverse and Calculate State Vector
        for (int i = 0; i < 37; i++) {
            if (node->children[i] != nullptr) {
                char child_char = getCharacter(i);
                
                int L = target.length();
                vector<int> curr_row(L + 1);
                
                // Initialize the first element (cost of deleting all characters so far)
                curr_row[0] = prev_row[0] + 1;
                int min_val = curr_row[0];

                // Compute the rest of the state vector for this specific child node
                for (int j = 1; j <= L; j++) {
                    int insert_cost = curr_row[j - 1] + 1;
                    int delete_cost = prev_row[j] + 1;
                    int replace_cost = prev_row[j - 1] + (target[j - 1] == child_char ? 0 : 1);
                    
                    curr_row[j] = min({insert_cost, delete_cost, replace_cost});
                    
                    // Track the minimum value in this row for pruning
                    min_val = min(min_val, curr_row[j]);
                }

                // 3. Pruning Condition
                // Only continue down this branch if it's mathematically possible to find a match
                if (min_val <= max_dist) {
                    searchFuzzyRecursive(node->children[i], target, curr_row, max_dist, current_id, cs);
                }
            }
        }
    }

public:
    MyTrie() { root = new TrieNode(); }

    ~MyTrie() { clear(root); }

    // CRITICAL: Disable copying to prevent double-free crashes
    MyTrie(const MyTrie &) = delete;
    MyTrie &operator=(const MyTrie &) = delete;

    // Optional: Allow moving so the array can be initialized easily
    MyTrie(MyTrie &&other) noexcept : root(other.root) { other.root = nullptr; }

    void insertWord(vector<int> &uniqueIndexes, DSU_SET &cs,
                    const string &word, int cid)
    {
        TrieNode *curr = root;

        for (int i = 0; i < word.size(); i++)
        {
            int index = getIndex(word[i]);
            if (index < 0 || index >= 37)
                continue;

            if (curr->children[index] == nullptr)
            {
                TrieNode *child = new TrieNode();
                curr->children[index] = child;
            }
            curr = curr->children[index];
        }

        if (curr->id == -1)
        {
            uniqueIndexes.push_back(cid);
            curr->id = cid;
        }
        else
        {
            cs.union_sets(curr->id, cid);
        }
    }

    void searchFuzzy(const string &target, int max_dist, int current_id, DSU_SET &cs) {
        int L = target.length();
        vector<int> initial_row(L + 1);
        
        // The root node's state vector is simply [0, 1, 2, 3, ..., L]
        for (int i = 0; i <= L; i++) {
            initial_row[i] = i;
        }
        
        searchFuzzyRecursive(root, target, initial_row, max_dist, current_id, cs);
    }
};

void removeDuplicates(vector<pair<int64_t, int64_t>> &arr)
{
    if (arr.size() <= 1)
        return;

    int count = 1;
    int freshPosition = 1;

    for (int i = 1; i < arr.size(); i++)
    {
        if (arr[i] != arr[i - 1])
        {
            arr[freshPosition] = arr[i];
            freshPosition++;
            count++;
        }
    }

    arr.resize(count);
}

inline void trim_in_place(std::string &str)
{
    constexpr const char *whitespace = " \t\n\r\f\v";

    // 1. Trim trailing whitespace first (Right trim)
    size_t end = str.find_last_not_of(whitespace);
    if (end == std::string::npos)
    {
        str.clear(); // The string is entirely whitespace
        return;
    }
    str.erase(
        end +
        1); // Erase from the end of the actual text to the end of the string

    // 2. Trim prevailing whitespace (Left trim)
    size_t start = str.find_first_not_of(whitespace);
    if (start > 0)
    {
        str.erase(
            0,
            start); // Erase from the beginning to the start of the actual text
    }
}

// A generic function that takes the raw records and a lambda/function pointer 
// to extract the specific attribute string
template <typename Extractor>
vector<int> process_single_attribute(const vector<BusinessRecord>& records, 
                                     int max_edit_distance, 
                                     Extractor extract_str) {
    int totalRecords = records.size();
    DSU_SET cs(totalRecords);
    vector<int> uniqueIndexes;
    uniqueIndexes.reserve(totalRecords);
    
    // The Trie is created strictly inside this function
    MyTrie tr; 
    
    // 1. Build Phase
    for (int i = 0; i < totalRecords; i++) {
        string attr = extract_str(records[i]);
        trim_in_place(attr); 
        if (!attr.empty()) {
            tr.insertWord(uniqueIndexes, cs, attr, i);
        }
    }

    // 2. Fuzzy Search Phase
    for (int cid : uniqueIndexes) {
        string target = extract_str(records[cid]);
        trim_in_place(target);
        tr.searchFuzzy(target, max_edit_distance, cid, cs);
    }

    // 3. Extraction Phase
    vector<int> candidate_set_ids(totalRecords);
    for (int i = 0; i < totalRecords; i++) {
        candidate_set_ids[i] = cs.find_set(i);
    }


    return candidate_set_ids; 
}

pair<vector<vector <int>>, vector<string>> getAllCandidateSets(const vector <BusinessRecord>& records){
    vector <vector <int>> candidateSets;
    vector <string> candidateSetNames;

    cout << "Processing raw_id..." << endl;
    candidateSets.push_back(process_single_attribute(records, 0, [](const BusinessRecord& r) { return r.raw_id; }));
    candidateSetNames.push_back("raw_id_candidate_set");

    cout << "Processing pin..." << endl;
    candidateSets.push_back(process_single_attribute(records, 0, [](const BusinessRecord& r) { return r.pin; }));
    candidateSetNames.push_back("pin_candidate_set");

    cout << "Processing PAN..." << endl;
    candidateSets.push_back(process_single_attribute(records, 1, [](const BusinessRecord& r) { return r.pan; }));
    candidateSetNames.push_back("pan_candidate_set");

    cout << "Processing GST..." << endl;
    candidateSets.push_back(process_single_attribute(records, 2, [](const BusinessRecord& r) { return r.gst; }));
    candidateSetNames.push_back("gst_candidate_set");

    cout << "Processing Phone..." << endl;
    candidateSets.push_back(process_single_attribute(records, 0, [](const BusinessRecord& r) { return r.phone; }));
    candidateSetNames.push_back("phone_candidate_set");

    cout << "Processing biz_name_norm (prefix)..." << endl;
    candidateSets.push_back(process_single_attribute(records, 2, [](const BusinessRecord& r) { 
        return r.biz_name_norm.substr(0, min((size_t)15, r.biz_name_norm.length())); 
    }));
    candidateSetNames.push_back("biz_name_norm_candidate_set");

    cout << "Processing address_norm (prefix)..." << endl;
    candidateSets.push_back(process_single_attribute(records, 2, [](const BusinessRecord& r) { 
        return r.address_norm.substr(0, min((size_t)15, r.address_norm.length())); 
    }));
    candidateSetNames.push_back("address_norm_candidate_set");
    return {candidateSets, candidateSetNames};
}


vector<BusinessRecord> load_parquet(const string &path)
{
    vector<BusinessRecord> records;
    duckdb::DuckDB db(nullptr);
    duckdb::Connection con(db);

    string query =
        "SELECT "
        "CAST(uri AS BIGINT), "
        "COALESCE(CAST(raw_id AS VARCHAR), ''), "
        "COALESCE(CAST(pin AS VARCHAR), ''), "
        "COALESCE(CAST(pan AS VARCHAR), ''), "
        "COALESCE(CAST(gst AS VARCHAR), ''), "
        "COALESCE(CAST(phone AS VARCHAR), ''), "
        "COALESCE(CAST(biz_name_norm AS VARCHAR), ''), "
        "COALESCE(CAST(address_norm AS VARCHAR), '') "
        "FROM read_parquet('" +
        path + "')";

    auto result = con.Query(query);
    if (result->HasError())
    {
        cerr << "Query failed: " << result->GetError() << endl;
        return records;
    }

    for (size_t r = 0; r < result->RowCount(); r++)
    {
        BusinessRecord rec;
        rec.uri = result->GetValue(0, r).GetValue<int64_t>();
        rec.raw_id = result->GetValue(1, r).GetValue<string>();
        rec.pin = result->GetValue(2, r).GetValue<string>();
        rec.pan = result->GetValue(3, r).GetValue<string>();
        rec.gst = result->GetValue(4, r).GetValue<string>();
        rec.phone = result->GetValue(5, r).GetValue<string>();
        rec.biz_name_norm = result->GetValue(6, r).GetValue<string>();
        rec.address_norm = result->GetValue(7, r).GetValue<string>();
        records.push_back(rec);
    }
    return records;
}

void export_candidate_sets_to_parquet(const string &path,
                                      const vector<BusinessRecord> &records,
                                      const vector<vector<int>> &candidate_sets,
                                      const vector<string> &candidate_set_names)
{
    duckdb::DuckDB db(nullptr);
    duckdb::Connection con(db);

    string create_query = "CREATE TABLE output_data ("
                          "uri BIGINT, "
                          "raw_id VARCHAR, "
                          "pin VARCHAR, "
                          "pan VARCHAR, "
                          "gst VARCHAR, "
                          "phone VARCHAR, "
                          "biz_name_norm VARCHAR, "
                          "address_norm VARCHAR";
    
    for (const string &name : candidate_set_names)
    {
        create_query += ", " + name + " INTEGER";
    }
    create_query += ")";
    
    con.Query(create_query);

    duckdb::Appender appender(con, "output_data");
    for (size_t i = 0; i < records.size(); i++)
    {
        appender.BeginRow();
        appender.Append<int64_t>(records[i].uri);
        appender.Append(records[i].raw_id.c_str());
        appender.Append(records[i].pin.c_str());
        appender.Append(records[i].pan.c_str());
        appender.Append(records[i].gst.c_str());
        appender.Append(records[i].phone.c_str());
        appender.Append(records[i].biz_name_norm.c_str());
        appender.Append(records[i].address_norm.c_str());
        
        for (size_t j = 0; j < candidate_sets.size(); j++)
        {
            appender.Append<int32_t>(candidate_sets[j][i]);
        }
        appender.EndRow();
    }
    appender.Close();

    con.Query("COPY output_data TO '" + path + "' (FORMAT PARQUET)");
}

void process_pipeline(const string &input_file, const string &output_file)
{
    cout << "Loading dataset from " << input_file << "..." << endl;
    vector<BusinessRecord> data = load_parquet(input_file);
    cout << "Loaded " << data.size() << " records using DuckDB." << endl;

    cout << "Running matching pipeline..." << endl;
    auto [candidate_sets, candidate_set_names] = getAllCandidateSets(data);

    cout << "Exporting to " << output_file << "..." << endl;
    export_candidate_sets_to_parquet(output_file, data, candidate_sets, candidate_set_names);
    cout << "C++ Pipeline processing complete!" << endl;
}


vector <BusinessRecord> getTestRecords(){
      vector<BusinessRecord> test_records = {
        // --- CLUSTER A: Exact Matches ---
        {0, "raw_0", "110011", "AAAAA0000A", "22AAAAA0000A1Z5", "123", "Acme", "Delhi"}, 
        {1, "raw_1", "110011", "AAAAA0000A", "22AAAAA0000A1Z5", "124", "Acme", "Delhi"}, 

        // --- CLUSTER B: Distance 1 Typos (Substitutions) ---
        {2, "raw_2", "110012", "BBBBB1111B", "07BBBBB1111B1Z6", "125", "Globex", "Mumbai"}, // Base
        {3, "raw_3", "110012", "BBBBB1111B", "07BBBBB1111B2Z6", "126", "Globex", "Mumbai"}, // Dist 1 from Base ('2' instead of '1')
        {4, "raw_4", "110012", "BBBBB1111B", "07BBBBB1111B1ZC", "127", "Globex", "Mumbai"}, // Dist 1 from Base ('C' instead of '6')

        // --- CLUSTER C: Distance 2 Typo ---
        // If MAX_EDIT_DISTANCE = 1, these should remain separate. If = 2, they will merge.
        {5, "raw_5", "110013", "CCCCC2222C", "27CCCCC2222C1Z7", "128", "Initech", "Pune"},   // Base
        {6, "raw_6", "110013", "CCCCC2222C", "27CCCCC2222D2Z7", "129", "Initech", "Pune"},   // Dist 2 from Base ('D' and '2')

        // --- CLUSTER D: The Union-Find Transitivity Chain Test ---
        // 7 is Dist 1 from 8. 8 is Dist 1 from 9. 
        // 7 is Dist 2 from 9. All three should merge into one cluster if max_dist = 1!
        {7, "raw_7", "110014", "DDDDD3333D", "09DDDDD3333D1Z8", "130", "Soylent", "Noida"},  // Base
        {8, "raw_8", "110014", "DDDDD3333D", "09DDDDD3333D2Z8", "131", "Soylent", "Noida"},  // Dist 1 from 7
        {9, "raw_9", "110014", "DDDDD3333D", "09DDDDD3333D2Z9", "132", "Soylent", "Noida"},  // Dist 1 from 8

        // --- CLUSTER E: Real-World OCR/Data Entry Noise ---
        {10, "raw_10", "110015", "EEEEE4444E", "10EEEEE5555E1Z0", "133", "Hooli", "Bangalore"}, // Base
        {11, "raw_11", "110015", "EEEEE4444E", "10EEEEE55S5E1Z0", "134", "Hooli", "Bangalore"}, // Dist 1 ('S' instead of '5')
        {12, "raw_12", "110015", "EEEEE4444E", "10EEEEE5555E1ZO", "135", "Hooli", "Bangalore"}, // Dist 1 ('O' instead of '0')

        // --- CLUSTERS F-M: Complete Noise (Should never cluster) ---
        {13, "raw_13", "110016", "FFFFF6666F", "33FFFFF6666F1Z1", "136", "Stark", "Chennai"},
        {14, "raw_14", "110017", "GGGGG7777G", "34GGGGG7777G1Z2", "137", "Wayne", "Kochi"},
        {15, "raw_15", "110018", "HHHHH8888H", "35HHHHH8888H1Z3", "138", "Oscorp", "Jaipur"},
        {16, "raw_16", "110019", "IIIII9999I", "36IIIII9999I1Z4", "139", "Cyber", "Surat"},
        {17, "raw_17", "110020", "JJJJJ0000J", "37JJJJJ0000J1Z5", "140", "Massive", "Patna"},
        {18, "raw_18", "110021", "KKKKK1111K", "38KKKKK1111K1Z6", "141", "Aperture", "Bhopal"},
        {19, "raw_19", "110022", "LLLLL2222L", "39LLLLL2222L1Z7", "142", "Umbrella", "Indore"}
    };
    return test_records;
}

int main(int argc, char **argv)
{
    if (argc < 3)
    {
        cerr << "Usage: " << argv[0] << " <input_parquet> <output_parquet>"
             << endl;
        return 1;
    }

    string input_file = argv[1];
    string output_file = argv[2];

    try
    {
        process_pipeline(input_file, output_file);
    }
    catch (const exception &e)
    {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }

    return 0;
}
