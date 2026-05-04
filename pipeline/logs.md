```bash
(venv) anish-goenka@ag-ubuntu:~/ai-for-bharat-hackathon/ai-for-bharat--team-AJAY/pipeline$ python3 generator.py 
 Generating synthetic business data for Karnataka...
 Generated 146 records for factories.csv
 Generated 158 records for shops.csv
 Generated 154 records for bescom.csv
(venv) anish-goenka@ag-ubuntu:~/ai-for-bharat-hackathon/ai-for-bharat--team-AJAY/pipeline$ python3 normalize.py 
 Starting data normalization...
 Loaded factories.csv
 Loaded shops.csv
 Loaded bescom.csv
 Exporting 458 rows to data/normalized_records.parquet via DuckDB...
 Normalization and export complete!
(venv) anish-goenka@ag-ubuntu:~/ai-for-bharat-hackathon/ai-for-bharat--team-AJAY/pipeline$ python3 candidate_pairer.py 
Building C++ Native Engine...
Starting candidate generation via C++ Native Engine...
Loading dataset from data/normalized_records.parquet...
Loaded 458 records using DuckDB.
Running matching pipeline...
Generated 483 candidate pairs.
Exporting to data/candidate_pairs.parquet...
C++ Pipeline processing complete!
Done!
(venv) anish-goenka@ag-ubuntu:~/ai-for-bharat-hackathon/ai-for-bharat--team-AJAY/pipeline$ python3 scoring.py 

[KA-UBID] Initializing Scoring Engine...
Loaded 458 master records.
Loaded 483 candidate pairs from C++ Trie engine.
SETTINGS VALIDATION: Errors were identified in your settings dictionary. 

======================================
Invalid Columns(s) in Blocking Rule(s)
======================================

    SQL: `(l.uri, r.uri) IN (SELECT uri1, uri2 FROM candidate_pairs)`
       - Invalid table names provided (only `l.` and `r.` are valid): `uri1`, `uri2`

You may want to verify your settings dictionary has valid inputs in all fields before continuing.

Starting Unsupervised Machine Learning (EM Algorithm)...
   -> Estimating random baseline (U-values)...
----- Estimating u probabilities using random sampling -----

Estimated u probabilities using random sampling

Your model is not yet fully trained. Missing estimates for:
    - pan (no m values are trained).
    - gst (no m values are trained).
    - biz_name_norm (no m values are trained).
    - address_norm (no m values are trained).
   -> Estimating parameters on PAN match...

----- Starting EM training session -----

Estimating the m probabilities of the model by blocking on:
l.pan = r.pan

Parameter estimates will be made for the following comparison(s):
    - gst
    - biz_name_norm
    - address_norm

Parameter estimates cannot be made for the following comparison(s) since they are used in the blocking rules: 
    - pan

WARNING:
Level All other comparisons on comparison gst not observed in dataset, unable to train m value

WARNING:
Level Jaro-Winkler distance of address_norm >= 0.8 on comparison address_norm not observed in dataset, unable to train m value

WARNING:
Level All other comparisons on comparison address_norm not observed in dataset, unable to train m value

Iteration 1: Largest change in params was 0.956 in probability_two_random_records_match
Iteration 2: Largest change in params was 0.014 in probability_two_random_records_match
Iteration 3: Largest change in params was 1.74e-05 in probability_two_random_records_match

EM converged after 3 iterations
m probability not trained for gst - All other comparisons (comparison vector value: 0). This usually means the comparison level was never observed in the training data.
m probability not trained for address_norm - Jaro-Winkler distance of address_norm >= 0.8 (comparison vector value: 1). This usually means the comparison level was never observed in the training data.
m probability not trained for address_norm - All other comparisons (comparison vector value: 0). This usually means the comparison level was never observed in the training data.

Your model is not yet fully trained. Missing estimates for:
    - pan (no m values are trained).
    - gst (some m values are not trained).
    - address_norm (some m values are not trained).
   -> Estimating parameters on Name match...

----- Starting EM training session -----

Estimating the m probabilities of the model by blocking on:
l.biz_name_norm = r.biz_name_norm

Parameter estimates will be made for the following comparison(s):
    - pan
    - gst
    - address_norm

Parameter estimates cannot be made for the following comparison(s) since they are used in the blocking rules: 
    - biz_name_norm

Iteration 1: Largest change in params was 0.832 in probability_two_random_records_match
Iteration 2: Largest change in params was 0.00169 in probability_two_random_records_match
Iteration 3: Largest change in params was 1e-07 in probability_two_random_records_match

EM converged after 3 iterations

Your model is fully trained. All comparisons have at least one estimate for their m and u values

Calculating Final Match Probabilities on custom pairs...
Blocking time: 0.01 seconds
Predict time: 0.08 seconds
Saved clean scores to 'data/final_ubid_matches.parquet' (URI_L, URI_R, score)

================================================================================
                    KA-UBID TRIE + SPLINK SCORING RESULTS
================================================================================
Match: venkataramanraghavan <-> venkataramanraghavan | Score: 100.00% | 🟢 AUTO-LINK
Match: mangat goel and sant <-> mangat goel and sant | Score: 100.00% | 🟢 AUTO-LINK
Match: balakrishnansachar   <-> balakrishnansachar   | Score: 100.00% | 🟢 AUTO-LINK
Match: vohra buch and munsh <-> vohra buch and munsh | Score: 100.00% | 🟢 AUTO-LINK
Match: varughesebail ent    <-> varughesebail ent    | Score: 100.00% | 🟢 AUTO-LINK
Match: sekhon gola and chah <-> sekhon gola and chah | Score: 100.00% | 🟢 AUTO-LINK
Match: bosesem              <-> bosesem              | Score: 100.00% | 🟢 AUTO-LINK
Match: dhawan ent           <-> dhawan ent           | Score: 100.00% | 🟢 AUTO-LINK
Match: de ltd               <-> de ltd               | Score: 100.00% | 🟢 AUTO-LINK
Match: bansal krishna and g <-> bansal krishna and g | Score: 100.00% | 🟢 AUTO-LINK
Match: misra ent            <-> misra ent            | Score: 100.00% | 🟢 AUTO-LINK
Match: cheemakothari        <-> cheemakothari        | Score: 100.00% | 🟢 AUTO-LINK
Match: sheresarna           <-> sheresarna           | Score: 100.00% | 🟢 AUTO-LINK
Match: chopra pandya and go <-> chopra pandya and go | Score: 100.00% | 🟢 AUTO-LINK
Match: balan dutta and acha <-> balan dutta and acha | Score: 100.00% | 🟢 AUTO-LINK
================================================================================
Run Complete. Output ready for decision routing.

(venv) anish-goenka@ag-ubuntu:~/ai-for-bharat-hackathon/ai-for-bharat--team-AJAY/pipeline$ 
```