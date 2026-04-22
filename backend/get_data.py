from ucimlrepo import fetch_ucirepo
adult = fetch_ucirepo(id=2)
df = adult.data.original
df.to_csv('adult_census.csv', index=False)
print("Done! Rows:", len(df))
print(df.head())