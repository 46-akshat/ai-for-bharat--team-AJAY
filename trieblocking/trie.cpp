#include <pybind11/pybind11.h>
#include <iostream>
#include <string>
namespace py = pybind11;
using namespace std;

int add(int i, int j) {
    cout << "adding  " << i << " " << j << endl;
    return i + j;
}

PYBIND11_MODULE(fast_math, m) {
    m.doc() = "A simple C++ extension module for Python";
    m.def("add", &add, "A function that adds two numbers");
}

class MyTrie {
    struct TrieNode {
        TrieNode* children[36]{};
        int count = 0;
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
        if (curr->count > 0)
            cout << s << " -> " << (curr->count) << endl;

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

    void insertWord(const string& word) {
        TrieNode* curr = root;

        for (int i = 0; i < word.size(); i++) {
            int index = getIndex(word[i]);

            if (curr->children[index] == nullptr) {
                TrieNode* child = new TrieNode();
                curr->children[index] = child;
            }
            curr = curr->children[index];
        }
        curr->count++;
    }

    void displayTrieWords() {
        TrieNode* curr = root;
        string toDisplay = "";
        display(root, toDisplay);
    }
};

int main() {
    MyTrie tr = MyTrie();
    int n;
    cin >> n;
    while (n--) {
        string gst;
        cin >> gst;
        tr.insertWord(gst);
    }

    tr.displayTrieWords();
    return 0;
}