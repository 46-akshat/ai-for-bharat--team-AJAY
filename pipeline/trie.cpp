#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
namespace py = pybind11;
using namespace std;


// 26 alpha + 10 digits = 36
class MyTrie {
    struct TrieNode {
        TrieNode* children[36]{};
        vector<string> uri;
    };

    int getIndex(char c) {
        if (c >= 'A' && c <= 'Z')
            return c - 'A';
        else
            return (c - '0') + 26;
    }

    char getCharacter(int idx) {
        if (idx >= 0 && idx < 26) {
            return (char)('A' + idx);
        } else {
            int offsetIdx = idx - 26;
            return (char)('0' + offsetIdx);
        }
    }

    TrieNode* root;

    void display(TrieNode* curr, string& s) {
        if ((curr->uri).size() > 0) {
            cout << s << " : ";
            for (auto i : curr->uri) cout << i << ", ";
            cout << endl;
        }

        for (int i = 0; i < 36; i++) {
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
        for (int i = 0; i < 36; i++) clear(curr->children[i]);
        delete curr;
    }

   public:
    MyTrie() { root = new TrieNode(); }

    ~MyTrie() { clear(root); }

    void insertWord(vector<vector<string>>& candidatePairs, const string& word,
                    const string& id) {
        TrieNode* curr = root;

        for (int i = 0; i < word.size(); i++) {
            int index = getIndex(word[i]);

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

    void displayTrieWords() {
        TrieNode* curr = root;
        string toDisplay = "";
        display(root, toDisplay);
    }
};

void removeDuplicates(vector<vector<string>>& arr) {
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

vector<vector<string>> get_candidate_pairs(const vector<vector<string>>& data) {
    MyTrie tr = MyTrie();
    vector<vector<string>> candidatePairs;
    for (int i = 0; i < data.size(); i++) {
        if (data[i].size() >= 2) {
            tr.insertWord(candidatePairs, data[i][1], data[i][0]);
        }
    }
    sort(candidatePairs.begin(), candidatePairs.end());
    removeDuplicates(candidatePairs);
    return candidatePairs;
}

PYBIND11_MODULE(trie_module, m) {
    m.doc() = "Trie module for candidate pair matching";
    m.def("get_candidate_pairs", &get_candidate_pairs, "Get candidate pairs from a list of strings");
}
