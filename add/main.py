import fast_math

def main():
    print("--- Python to C++ Handoff System ---")
    
    # 1. Gather data in Python
    val1 = int(input("Enter first number: "))
    val2 = int(input("Enter second number: "))
    
    # 2. The Handoff
    result = fast_math.add(val1, val2)
    
    # 3. Resume Python processing
    print(f"The sum returned from C++ is: {result}")

if __name__ == "__main__":
    main()