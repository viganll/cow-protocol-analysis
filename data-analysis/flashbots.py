import pandas as pd
from Plotting import sandwich_attacks_solvers
import matplotlib.pyplot as plt
import numpy as np


def generate_flashbots_plots(data):
    privately_submitted_transactions(data)
    batches_submitted_via_flashbots(data)
    pieChart(data)


def privately_submitted_transactions(batchesInBundles):
    df_filtered = batchesInBundles[batchesInBundles['numberOfTransactions'] == 1]
    df_filtered['timestamp'] = df_filtered['timestamp'].apply(lambda x: str(x)[:10])
    df_filtered['timestamp'] = pd.to_datetime(df_filtered['timestamp'])  # Convert the 'date' column to datetime type

    df_weekly = df_filtered.resample('W', on='timestamp').count()
    plt.bar(df_weekly.index, df_weekly['timestamp'], width=7)  # Assuming weekly frequency

    # Set labels and title
    plt.xlabel('Week')
    plt.ylabel('Number of Entries')
    plt.title('Number of privately submitted transactions per Week')
    # Show the plot
    plt.tight_layout()
    plt.show()


def weekly_sandwich_attacks(sandwichAttacksData):
    sandwichAttacksData['block_date'] = pd.to_datetime(sandwichAttacksData['block_date'])  # Convert the 'date' column to datetime type

    # Group by week and calculate the sum of the 'value' column for each week
    df_weekly = sandwichAttacksData.resample('W', on='block_date').count()
    plt.bar(df_weekly.index, df_weekly['block_date'], width=7)  # Assuming weekly frequency

    # Set labels and title
    plt.xlabel('Week')
    plt.ylabel('Number of Entries')
    plt.title('Number of Entries per Week')

    # Show the plot
    plt.tight_layout()
    plt.show()

    return df_weekly


def sandwiched_vs_total_batches_log_scale(sandwichedData, totalBatchData):
    sandwichedData.sort_values(by="_col1", inplace = True, ascending=False)
    sandwichedData = sandwichedData[:12]
    allData = totalBatchData.merge(sandwichedData, on="solver_address")
    species = allData['solver_address']
    bars = {}
    bars["Total batches"] = list(allData['total_batches'])
    bars["Sandwiched transactions"] = list(allData['_col1'])
    x = np.arange(len(species))  # the label locations
    width = 0.3  # the width of the bars
    multiplier = 0.5

    fig, ax = plt.subplots(layout='constrained')

    for attribute, measurement in bars.items():
        offset = width * multiplier
        rects = ax.bar(x + offset, measurement, width, label=attribute)
        ax.bar_label(rects, padding=3)
        multiplier += 1
    ax.set_ylabel('Count [log]')
    ax.set_title('Solver Address')
    ax.set_xticks(x + width, range(len(species)))
    ax.legend(loc='upper left', bbox_to_anchor=(0.5, -0.05), ncols=2)
    ax.set_title('Number of total batches vs number of sandwiched transactions')

    plt.yscale("log")

    plt.show()


def get_batches_submitted_via_flashbots(batchData):
    submittedByFlashbots = batchData.drop(batchData[batchData.batchIndex].index)
    return submittedByFlashbots


def batches_submitted_via_flashbots(data):
    grouped_by_batch_index = data.groupby(by=['batchIndex'])
    batchIndex = list(grouped_by_batch_index.groups.keys())
    occurrences = []
    for key in grouped_by_batch_index.groups.keys():
        group = grouped_by_batch_index.get_group(key)
        occurrences.append(len(group))

    fig, ax = plt.subplots()
    ax.grid()
    ax.bar(batchIndex, occurrences, width=0.7, edgecolor="white", linewidth=0.7)
    ax.set_xlabel('Batch Index')
    ax.set_ylabel('Occurrences', color='g')
    plt.xlim(0, 1)
    plt.locator_params(axis='x', nbins=2)

    plt.show()


def pieChart(data):
    labels = list(data["Number of trades"])
    sizes = list(data["Frequency"])

    plt.rcParams['font.family'] = 'Arial'

    fig, ax = plt.subplots(figsize=(6, 3), subplot_kw=dict(aspect="equal"))

    NumberOfTrades = [x.split()[-1] for x in labels]

    def func(pct, allvals):
        absolute = int(pct / 100. * np.sum(allvals))
        return "{:.1f}%\n({:d} g)".format(pct, absolute)

    wedges, texts, autotexts = ax.pie(sizes, autopct=lambda pct: func(pct, data),
                                      textprops=dict(color="w"))

    ax.legend(wedges, NumberOfTrades,
              title="Number of trades",
              loc="center left",
              bbox_to_anchor=(1, 0, 0.5, 1))

    plt.setp(autotexts, size=8, weight="bold")

    ax.set_title("Trades frequency")

    plt.show()
