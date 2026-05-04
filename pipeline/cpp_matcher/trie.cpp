#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

#include "duckdb.hpp"

using namespace std;

struct BusinessRecord {
    int64_t uri;
    string raw_id;
    string pin;
    string pan;
    string gst;
    string phone;
    string biz_name_norm;
    string address_norm;
};

// 26 alpha + 10 digits = 36
class MyTrie {
    struct TrieNode {
        TrieNode* children[37]{};
        vector<int64_t> uri;
    };

    TrieNode* root;

    int getIndex(char c) {
        if (c == ' ')
            return 36;
        else if (c >= 'A' && c <= 'Z')
            return c - 'A';
        else
            return (c - '0') + 26;
    }

    char getCharacter(int idx) {
        if (idx >= 0 && idx < 26) {
            return (char)('A' + idx);
        } else if (idx < 36) {
            int offsetIdx = idx - 26;
            return (char)('0' + offsetIdx);
        } else
            return ' ';
    }

    void display(TrieNode* curr, string& s) {
        if ((curr->uri).size() > 0) {
            cout << s << " : ";
            for (auto i : curr->uri) cout << i << ", ";
            cout << endl;
        }

        for (int i = 0; i < 37; i++) {
            if (curr->children[i] != nullptr) {
                char letter = getCharacter(i);
                s.push_back(letter);
                display((curr->children)[i], s);
                s.pop_back();
            }
        }
    }

    void clear(TrieNode* curr) {
        if (curr == nullptr)
            return;
        for (int i = 0; i < 37; i++) clear(curr->children[i]);
        delete curr;
    }

   public:
    MyTrie() { root = new TrieNode(); }

    ~MyTrie() { clear(root); }

    // CRITICAL: Disable copying to prevent double-free crashes
    MyTrie(const MyTrie&) = delete;
    MyTrie& operator=(const MyTrie&) = delete;

    // Optional: Allow moving so the array can be initialized easily
    MyTrie(MyTrie&& other) noexcept : root(other.root) { other.root = nullptr; }

    void insertWord(vector<pair<int64_t, int64_t>>& candidatePairs,
                    const string& word, int64_t id) {
        TrieNode* curr = root;

        for (int i = 0; i < word.size(); i++) {
            int index = getIndex(word[i]);
            if (index < 0 || index >= 37)
                continue;

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

inline void trim_in_place(std::string& str) {
    constexpr const char* whitespace = " \t\n\r\f\v";

    // 1. Trim trailing whitespace first (Right trim)
    size_t end = str.find_last_not_of(whitespace);
    if (end == std::string::npos) {
        str.clear();  // The string is entirely whitespace
        return;
    }
    str.erase(
        end +
        1);  // Erase from the end of the actual text to the end of the string

    // 2. Trim prevailing whitespace (Left trim)
    size_t start = str.find_first_not_of(whitespace);
    if (start > 0) {
        str.erase(
            0,
            start);  // Erase from the beginning to the start of the actual text
    }
}

vector<pair<int64_t, int64_t>> get_candidate_pairs(
    const vector<BusinessRecord>& data) {
    // TODO : Modify the implementation to consider only the first few
    // characters of the address and name(blindly inserting them is leading to
    // an explosion in number of candidate pairs)
    const size_t totalAttributes = 4;
    array<MyTrie, totalAttributes> tries;

    vector<vector<pair<int64_t, int64_t>>> all_candidate_pairs(totalAttributes);
    int totalRecords = data.size();
    for (int i = 0; i < totalRecords; i++) {
        int64_t uri = data[i].uri;

        array<string, totalAttributes> attributes;
        attributes[0] = data[i].pin;
        attributes[1] = data[i].pan;
        attributes[2] = data[i].gst;
        attributes[3] = data[i].phone;
        // attributes[4] = data[i].biz_name_norm;
        // attributes[5] = data[i].address_norm;

        for (int j = 0; j < totalAttributes; j++) {
            trim_in_place(attributes[j]);
            if (attributes[j].size() > 0)
                tries[j].insertWord(all_candidate_pairs[j], attributes[j], uri);
        }
    }

    // cleanup individual results
    size_t potential_total_size = 0;

    for (auto& candidate_pairs : all_candidate_pairs) {
        sort(candidate_pairs.begin(), candidate_pairs.end());
        removeDuplicates(candidate_pairs);
        potential_total_size += candidate_pairs.size();
    }

    vector<pair<int64_t, int64_t>> final_candidate_pairs;
    final_candidate_pairs.reserve(potential_total_size);

    for (auto& candidate_pairs : all_candidate_pairs) {
        final_candidate_pairs.insert(
            final_candidate_pairs.end(),
            make_move_iterator(candidate_pairs.begin()),
            make_move_iterator(candidate_pairs.end()));
    }

    sort(final_candidate_pairs.begin(), final_candidate_pairs.end());
    removeDuplicates(final_candidate_pairs);
    return final_candidate_pairs;
}

vector<BusinessRecord> load_parquet(const string& path) {
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
    if (result->HasError()) {
        cerr << "Query failed: " << result->GetError() << endl;
        return records;
    }

    for (size_t r = 0; r < result->RowCount(); r++) {
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

void export_pairs_to_parquet(const string& path,
                             const vector<pair<int64_t, int64_t>>& pairs) {
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
        cerr << "Usage: " << argv[0] << " <input_parquet> <output_parquet>"
             << endl;
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
