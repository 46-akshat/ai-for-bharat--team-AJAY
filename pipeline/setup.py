import sys
from setuptools import setup
from pybind11.setup_helpers import Pybind11Extension, build_ext

# Pybind11Extension automatically handles compiler-specific flags (like /O2 for MSVC and -O3 for GCC/Clang)
ext_modules = [
    Pybind11Extension(
        "trie_module",
        ["trie.cpp"],
    ),
]

setup(
    name="trie_module",
    version="0.1.0",
    description="Trie module for candidate pair matching",
    ext_modules=ext_modules,
    cmdclass={"build_ext": build_ext},
    zip_safe=False,
    python_requires=">=3.7",
)
