#include <pybind11/pybind11.h>
#include <iostream>
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