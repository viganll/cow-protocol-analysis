import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import pandas as pd
from utils import generate_data_lists, plot_tokens_with_most_cows, millions_formatter
plt.rcParams.update({'font.size': 12})

def generate_cow_protocol_plots(cow_protocol_data):
    # total cows in usd vs batches in usd
    plot_batch_and_cow_values_in_usd(cow_protocol_data)

    # comparison of total batch value in USD to no interaction transaction value in USD
    plot_batch_and_no_interaction_values_in_usd(cow_protocol_data)

    # comparison of cow value in USD compared to maximum possible cow value
    plot_cow_and_max_cow_values_in_usd(cow_protocol_data)

    # frequency of cows
    plot_frequency_of_cows(cow_protocol_data)

    # most common tokens
    plot_tokens_with_most_cows(cow_protocol_data)

def plot_batch_and_cow_values_in_usd(data):
    dates, txHash, cowScore, maxCowScore, cowValueInUSD, blockNumber, batchValueInUSD, \
    timestamp, tokensOut = generate_data_lists(data)
    fig, ax1 = plt.subplots()

    # Set the custom formatter for the y-axis

    ax1.plot(dates, cowValueInUSD, 'g-', label="Total Cows")
    ax1.plot(dates, batchValueInUSD, 'b-', label="Total Batches")

    ax1 = plt.gca()
    ax1.yaxis.set_major_formatter(ticker.FuncFormatter(millions_formatter))

    ax1.set_xlabel('Dates')
    ax1.set_ylabel('Total Value in USD (log)')
    ax1.legend(ncols=2)
    ax1.grid()
    plt.xticks(rotation=45)
    plt.yscale("log")

    plt.show()

def plot_batch_and_no_interaction_values_in_usd(data):
    dates, txHash, cowScore, maxCowScore, cowValueInUSD, blockNumber, batchValueInUSD, \
    timestamp, tokensOut = generate_data_lists(data)
    dataNoInteraction = data[data['noInteraction'] == True]
    dates_noi, txHash_noi, cowScore_noi, maxCowScore_noi, cowValueInUSD_noi, blockNumber_noi, batchValueInUSD_noi, \
    timestamp_noi, tokensOut_noi = generate_data_lists(dataNoInteraction)

    fig, ax1 = plt.subplots()

    ax2 = ax1.twinx()
    ax1.plot(dates, cowValueInUSD, 'g-')
    ax2.plot(dates_noi, batchValueInUSD_noi, 'b-')

    ax1.set_xlabel('Dates')
    ax1.set_ylabel('Total Cows [USD]', color='g')
    ax2.set_ylabel('Total Batches with no Interaction [USD]', color='b')
    plt.xticks(rotation=90)

    ax1.set_ylim([0, 400000])
    ax2.set_ylim([0, 400000])

    plt.show()


def plot_cow_and_max_cow_values_in_usd(data):
    dates, txHash, cowScore, maxCowScore, cowValueInUSD, blockNumber, batchValueInUSD, \
    timestamp, tokensOut = generate_data_lists(data)
    maxCowValueInUSD = list(np.array(maxCowScore)*np.array(cowValueInUSD)/np.array(cowScore))

    fig, ax1 = plt.subplots()

    ax2 = ax1.twinx()
    ax1.plot(dates, cowValueInUSD, 'g-')
    ax2.plot(dates, maxCowValueInUSD, 'b-')

    ax1.set_xlabel('Dates')
    ax1.set_ylabel('Total Cows [USD]', color='g')
    ax2.set_ylabel('Total MaxCows [USD]', color='b')
    plt.xticks(rotation=90)

    ax1.set_ylim([0, 400000])
    ax2.set_ylim([0, 400000])

    #fig.savefig("cow_vs_maxCow.png", dpi=300, bbox_inches='tight')
    plt.show()


def plot_frequency_of_cows(batchesDataCow):
    range_start = 0.1
    range_end = 1
    step = 0.1

    batchesDataCow['original_order'] = range(len(batchesDataCow))

    # Group the data and calculate frequency
    bins = [i * step for i in range(int(range_start / step), int(range_end / step) + 1)]
    labels = [f"{start:.1f} to {end:.1f}" for start, end in zip(bins[:-1], bins[1:])]
    batchesDataCow['range'] = pd.cut(batchesDataCow['cowScore'], bins=bins, labels=labels, right=False)
    result = batchesDataCow['range'].value_counts().reset_index()
    result.columns = ['Range', 'Frequency']
    result.sort_values(by="Range", inplace=True)

    fig, ax = plt.subplots()
    barWidth = 0.6
    ax.bar(list(result['Range']), list(result['Frequency']), barWidth, label="total batches", color="blue")
    ax.set_xlabel('Cow Score')
    ax.set_ylabel('Frequency')
    ax.set_title('Frequency of cows')
    plt.show()
