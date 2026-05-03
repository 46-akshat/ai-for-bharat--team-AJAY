# Compiler settings
CXX = c++
CXXFLAGS = -O3 -Wall -shared -std=c++17 -fPIC

# Fetch dynamic Python/pybind11 configurations
INCLUDES = $(shell python3 -m pybind11 --includes)
EXTENSION = $(shell python3-config --extension-suffix)

# Target and source files
TARGET = trie_module$(EXTENSION)
SRC = trie.cpp

# Default rule
all: $(TARGET)

# Build rule
$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $< -o $@

# Cleanup rule
clean:
	rm -f $(TARGET)