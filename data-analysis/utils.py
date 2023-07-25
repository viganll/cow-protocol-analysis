import os
import pandas as pd
import matplotlib.pyplot as plt
from consts import BATCHES_IN_BUNDLES_PATH, COW_BATCHES_PATH, COW_BLOCKS_PATH, DATA_PATH, TRADES_PER_BATCH_PATH

def millions_formatter(x, pos):
    return f'{int(x / 1e6)}m'

def read_text_file(file_path):
    with open(file_path, 'r') as f:
        print(f.read())

def get_data_path(file):
    current_directory = os.path.dirname(__file__)
    return os.path.join(current_directory, DATA_PATH, file) 

def merge_json_files(path):
    os.chdir(path)
    merged_data = pd.DataFrame()
    # iterate through all file
    for file in os.listdir():
        # Check whether file is in text format or not
        if file.endswith(".json"):
            file_path = os.path.join(path, file) 
            # call read text file function
            json_file = pd.read_json(file_path)
            merged_data = merged_data._append(json_file)
    return merged_data


def generate_data_lists(data):
    data['date'] = data['timestamp'].apply(lambda x: str(x)[:10])
    grouped_data = data.groupby(by=['date'])

    # create dates and total cow - prepare for plotting
    dates = list(grouped_data.groups.keys())

    txHash = []
    cowScore = []
    maxCowScore = []
    blockNumber = []
    cowValueInUSD = []
    batchValueInUSD = []
    noInteraction = []
    timestamp = []
    tokensOut = []
    for key in grouped_data.groups.keys():
        group = grouped_data.get_group(key)
        txHash.append(group['txHash'])
        cowScore.append(abs(group['cowScore'].sum()))
        maxCowScore.append(abs(group['maxCowScore'].sum()))
        blockNumber.append(group['blockNumber'])
        cowValueInUSD.append(abs(group['cowValueInUsd'].sum()))
        batchValueInUSD.append((group['batchValueInUsd'].sum()))
        noInteraction.append(group['noInteraction'])
        timestamp.append(group['timestamp'])
        tokensOut.append(group['tokensOut'])

    return dates, txHash, cowScore, maxCowScore, cowValueInUSD, blockNumber, batchValueInUSD, \
        timestamp, tokensOut


def generate_data_lists_uni_swap(data):
    data['date'] = data['timestamp'].apply(lambda x: str(x)[:13])
    grouped_data = data.groupby(by=['date'])

    # create dates and total cow - prepare for plotting
    dates = list(grouped_data.groups.keys())

    maxCowScore = []
    maxCowValueInUsd = []
    blockNumber = []
    batchValueInUSD = []
    timestamp = []
    tokensOut = []
    for key in grouped_data.groups.keys():
        group = grouped_data.get_group(key)
        maxCowScore.append(abs(group['maxCowScore'].sum()))
        maxCowValueInUsd.append(group["maxCowValueInUsd"].sum())
        blockNumber.append(group['blockNumber'])
        batchValueInUSD.append((group['batchValueInUsd'].sum()))
        timestamp.append(group['timestamp'])
        tokensOut.append(group['tokensOut'])

    return dates, maxCowScore, maxCowValueInUsd, blockNumber, batchValueInUSD, \
        timestamp, tokensOut


def plot_tokens_with_most_cows(data):
    tokenName = {}
    for x, row in data.iterrows():
        for i in row['tokensOut']:
            if i['token'] in tokenName:
                tokenName[i['token']] += i['cowValueInUsd']
            else:
                tokenName[i['token']] = i['cowValueInUsd']

    tokenNameNoZeros = {}
    for x, y in tokenName.items():
        if y > 0:
            tokenNameNoZeros[x] = y
    tokenNameSorted = dict(sorted(tokenNameNoZeros.items(), key=lambda x: x[1], reverse=True))

    fig, ax = plt.subplots()
    ax.bar(tokenNameSorted.keys(), tokenNameSorted.values(), width=0.7, edgecolor="white", linewidth=0.7)

    ax.set_xlabel('Tokens')
    ax.set_ylabel('Value in USD')
    plt.xticks(rotation=90)
    plt.show()


def remove_first_ten_chars(element):
    newElement = str(element[10:]) + ":00"
    return newElement
