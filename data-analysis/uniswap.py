import matplotlib.pyplot as plt
import numpy as np
from utils import generate_data_lists_uni_swap, plot_tokens_with_most_cows, remove_first_ten_chars, millions_formatter
import pandas as pd
import matplotlib.ticker as ticker
plt.rcParams.update({'font.size': 12})
width = 8.27
height = 5.5

def generate_uniswap_plots(uniswap_data):
    plot_cow_and_block_values_in_usd_unknown(uniswap_data)
    plot_cow_and_block_values_in_usd(uniswap_data)
    plot_tokens_with_most_cows(uniswap_data)


def plot_cow_and_block_values_in_usd_unknown(uniswap_data):
    x = uniswap_data['blockNumber'].tolist()
    y = uniswap_data['maxCowValueInUsd'].tolist()
    z = uniswap_data['batchValueInUsd'].tolist()

    fig, ax1 = plt.subplots(figsize=(width, height))
    ax1.plot(x, y, 'g-')
    ax1.plot(x, z, 'b-')
    ax1.set_xlabel('')
    fig.savefig("totalCowsAndBatchesInUniswap.png", dpi=300, bbox_inches = 'tight')
    plt.show()

def plot_cow_and_block_values_in_usd(data):
    dates, maxCowScore, maxCowValueInUsd, blockNumber, batchValueInUSD, \
    timestamp, tokensOut = generate_data_lists_uni_swap(data)
    fig, ax1 = plt.subplots(figsize=(width, height))
    time = list(map(remove_first_ten_chars,dates))

    # Set the custom formatter for the y-axis
    ax1 = plt.gca()
    ax1.yaxis.set_major_formatter(ticker.FuncFormatter(millions_formatter))

    ax2 = ax1.twinx()
    ax2.yaxis.set_major_formatter(ticker.FuncFormatter(millions_formatter))
    ax1.plot(time, maxCowValueInUsd, 'g-')
    ax2.plot(time, batchValueInUSD, 'b-')

    ax1.set_xlabel('Time [h]')
    ax1.set_ylabel('Maximum Possible CoWs [USD]', color='g')
    ax2.set_ylabel('Total Batch Value [USD]', color='b')

    ax1.grid()
    ax1.set_ylim([0, 25000000])
    ax2.set_ylim([0, 25000000])

    plt.show()
