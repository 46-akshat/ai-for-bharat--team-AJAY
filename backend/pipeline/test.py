import pandas as pd

df = pd.read_csv("data/factories.csv")

# This will print a list of every column and how many nulls it has
print(df.isnull().sum())