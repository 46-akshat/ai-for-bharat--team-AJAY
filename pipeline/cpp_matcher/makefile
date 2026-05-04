# Compiler settings
CXX = c++
CXXFLAGS = -O3 -Wall -std=c++17

# Targets and source files
TARGET = matcher
SRC = trie.cpp

# Default rule
all: $(TARGET)

# Build rule
$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $< -o $@ -L. -lduckdb -Wl,-rpath,.

# Cleanup rule
clean:
	rm -f $(TARGET)
