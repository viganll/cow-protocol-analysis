import pandas as pd
import os
from cow_protocol import generate_cow_protocol_plots
from uniswap import generate_uniswap_plots
from flashbots import sandwiched_vs_total_batches_log_scale, weekly_sandwich_attacks, generate_flashbots_plots, pieChart
from utils import merge_json_files, read_text_file, get_data_path
from consts import *

# We read the respective files from the given paths, merge the files into one dataframe and generate plots

uniswap_block_data = merge_json_files(get_data_path(COW_BLOCKS_PATH))
generate_uniswap_plots(uniswap_block_data)

cow_protocol_batch_data = merge_json_files(get_data_path(COW_BATCHES_PATH))
generate_cow_protocol_plots(cow_protocol_batch_data)

# i commented this part because it takes a long time to execute
# pathBatchesInBundles = "./batches_in_bundles"
#batchesInBundles = merge_json_files(os.path.join(base_directory,DATA_PATH pathBatchesInBundles))
#generate_flashbots_plots(batchesInBundles)



trades_batch = pd.read_csv(get_data_path(TRADES_PER_BATCH_PATH))
# pieChart(trades_batch)
sandwiched_per_solver = pd.read_csv(get_data_path(SANDWICHED_PER_SOLVER_PATH))
total_batches_per_solver = pd.read_csv(get_data_path(BATCH_PER_SOLVER_PATH))
sandwiched_vs_total_batches_log_scale(sandwiched_per_solver, total_batches_per_solver)


# total sandwich attacks on weekly basis
sandwichAttacks = pd.read_csv(get_data_path(BATCHES_SANDWICHED))
weekly = weekly_sandwich_attacks(sandwichAttacks)