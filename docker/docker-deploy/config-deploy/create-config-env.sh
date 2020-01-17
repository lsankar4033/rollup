#!/bin/bash

path_synch="$(pwd)/rollup-operator/src/server/synch-config.json"
path_pool="$(pwd)/rollup-operator/src/server/pool-config.json"
path_wallet="{pwd}/rollup-operator/src/server/wallet.json"

echo "MNEMONIC = \"$MNEMONIC\"
URL = \"$URL\"
INDEX_ACCOUNT = \"$INDEX_ACCOUNT\"
ACCOUNT_TOKEN_FEES = \"$ACCOUNT_TOKEN_FEES\"" > config.env