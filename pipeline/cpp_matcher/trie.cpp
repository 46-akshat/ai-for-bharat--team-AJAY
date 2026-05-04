#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include "duckdb.hpp"

using namespace std;

struct BusinessRecord {
    int64_t uri;
    string raw_id;
    int64_t pin;
    string pan;
    string gst;
    int64_t phone;
    string biz_name_norm;
    string address_norm;
};

// 26 alpha + 10 digits = 36
class MyTrie {
    struct TrieNode {
        TrieNode* children[36]{};
        vector<int64_t> uri;
    };

    int getIndex(char c) {
        if (c >= 'A' && c <= 'Z')
            return c - 'A';
        else
            return (c - '0') + 26;
    }

    TrieNode* root;

    void clear(TrieNode* curr) {
        if (curr == nullptr)
            return;
        for (int i = 0; i < 36; i++) clear(curr->children[i]);
        delete curr;
    }

   public:
    MyTrie() { root = new TrieNode(); }

    ~MyTrie() { clear(root); }

    void insertWord(vector<pair<int64_t, int64_t>>& candidatePairs, const string& word,
                    int64_t id) {
        TrieNode* curr = root;

        for (int i = 0; i < word.size(); i++) {
            int index = getIndex(word[i]);
            if (index < 0 || index >= 36) continue;

            if (curr->children[index] == nullptr) {
                TrieNode* child = new TrieNode();
                curr->children[index] = child;
            }
            curr = curr->children[index];
        }

        if (curr->uri.size() > 0) {
            for (auto prevUri : curr->uri) {
                candidatePairs.push_back({id, prevUri});
            }
        }
        (curr->uri).push_back(id);
    }
};

void removeDuplicates(vector<pair<int64_t, int64_t>>& arr) {
    if (arr.size() <= 1)
        return;

    int count = 1;
    int freshPosition = 1;

    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] != arr[i - 1]) {
            arr[freshPosition] = arr[i];
            freshPosition++;
            count++;
        }
    }

    arr.resize(count);
}

vector<pair<int64_t, int64_t>> get_candidate_pairs(const vector<BusinessRecord>& data) {
    MyTrie tr = MyTrie();
    vector<pair<int64_t, int64_t>> candidatePairs;
    for (int i = 0; i < data.size(); i++) {
        if (data[i].gst.length() >= 2) {
            tr.insertWord(candidatePairs, data[i].gst, data[i].uri);
        }
    }
    sort(candidatePairs.begin(), candidatePairs.end());
    removeDuplicates(candidatePairs);
    return candidatePairs;
}

vector<BusinessRecord> load_parquet(const string& path) {
    vector<BusinessRecord> records;
    duckdb::DuckDB db(nullptr);
    duckdb::Connection con(db);

    string query = "SELECT "
                   "CAST(uri AS BIGINT), "
                   "COALESCE(CAST(raw_id AS VARCHAR), ''), "
                   "COALESCE(CAST(pin AS BIGINT), 0), "
                   "COALESCE(CAST(pan AS VARCHAR), ''), "
                   "COALESCE(CAST(gst AS VARCHAR), ''), "
                   "COALESCE(CAST(phone AS BIGINT), 0), "
                   "COALESCE(CAST(biz_name_norm AS VARCHAR), ''), "
                   "COALESCE(CAST(address_norm AS VARCHAR), '') "
                   "FROM read_parquet('" + path + "')";
                   
    auto result = con.Query(query);
    if (result->HasError()) {
        cerr << "Query failed: " << result->GetError() << endl;
        return records;
    }
    
    for (size_t r = 0; r < result->RowCount(); r++) {
        BusinessRecord rec;
        rec.uri = result->GetValue(0, r).GetValue<int64_t>();
        rec.raw_id = result->GetValue(1, r).GetValue<string>();
        rec.pin = result->GetValue(2, r).GetValue<int64_t>();
        rec.pan = result->GetValue(3, r).GetValue<string>();
        rec.gst = result->GetValue(4, r).GetValue<string>();
        rec.phone = result->GetValue(5, r).GetValue<int64_t>();
        rec.biz_name_norm = result->GetValue(6, r).GetValue<string>();
        rec.address_norm = result->GetValue(7, r).GetValue<string>();
        records.push_back(rec);
    }
    return records;
}

void export_pairs_to_parquet(const string& path, const vector<pair<int64_t, int64_t>>& pairs) {
    duckdb::DuckDB db(nullptr);
    duckdb::Connection con(db);
    
    con.Query("CREATE TABLE pairs (uri1 BIGINT, uri2 BIGINT)");
    
    duckdb::Appender appender(con, "pairs");
    for (const auto& p : pairs) {
        appender.BeginRow();
        appender.Append<int64_t>(p.first);
        appender.Append<int64_t>(p.second);
        appender.EndRow();
    }
    appender.Close();
    
    con.Query("COPY pairs TO '" + path + "' (FORMAT PARQUET)");
}

void process_pipeline(const string& input_file, const string& output_file) {
    cout << "Loading dataset from " << input_file << "..." << endl;
    vector<BusinessRecord> data = load_parquet(input_file);
    cout << "Loaded " << data.size() << " records using DuckDB." << endl;
    
    cout << "Running matching pipeline..." << endl;
    auto pairs = get_candidate_pairs(data);
    cout << "Generated " << pairs.size() << " candidate pairs." << endl;
    
    cout << "Exporting to " << output_file << "..." << endl;
    export_pairs_to_parquet(output_file, pairs);
    cout << "C++ Pipeline processing complete!" << endl;
}

int main(int argc, char** argv) {
    if (argc < 3) {
        cerr << "Usage: " << argv[0] << " <input_parquet> <output_parquet>" << endl;
        return 1;
    }
    
    string input_file = argv[1];
    string output_file = argv[2];
    
    try {
        process_pipeline(input_file, output_file);
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
    
    return 0;
}
