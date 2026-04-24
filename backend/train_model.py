import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

df = pd.read_csv('adult_census.csv')

# Clean ALL string columns — strip leading/trailing spaces
for col in df.select_dtypes(include=['object']).columns:
    df[col] = df[col].str.strip()

# Manually encode income to binary — never use LabelEncoder on target
# >50K = 1 (positive outcome), <=50K = 0
print("Income unique values:", df['income'].unique())
# Strip dots too — some rows have '>50K.' with a trailing period
df['income'] = df['income'].str.replace('.', '', regex=False)
df['income'] = (df['income'] == '>50K').astype(int)
print("After encoding:", df['income'].unique())  # should show [0, 1] only

# Encode all other text columns
df_encoded = df.copy()
encoders = {}  # Store encoders for each column

for col in df_encoded.select_dtypes(include=['object']).columns:
    if col == 'income': continue
    le = LabelEncoder()
    df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
    encoders[col] = le

X = df_encoded.drop(columns=['income'])
y = df_encoded['income']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=15,
    random_state=42
)
model.fit(X_train, y_train)

# Save EVERYTHING as a bundle
joblib.dump({"model": model, "encoders": encoders}, 'demo_model.pkl')
print("Model and Encoders saved!")
print("Train accuracy:", round(model.score(X_train, y_train) * 100, 2), "%")
print("Test  accuracy:", round(model.score(X_test,  y_test)  * 100, 2), "%")