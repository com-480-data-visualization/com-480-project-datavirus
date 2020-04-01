# Project of Data Visualization (COM-480)

| Student's name  | SCIPER |
| --------------- | ------ |
| Timoté Vaucher  | 246532 |
| Jonathan Kaeser | 246422 |

Project Description is available [here](https://com-480-data-visualization.github.io/2020-project-guidelines/)

[Milestone 1](#milestone-1-friday-3rd-april-5pm) • [Milestone 2](#milestone-2-friday-1st-may-5pm) • [Milestone 3](#milestone-3-thursday-28th-may-5pm)

## Milestone 1 (Friday 3rd April, 5pm)

**10% of the final grade**

### 1.1 Dataset

We use an internal dataset provided by [dlab]( https://dlab.epfl.ch/ ) on YouTube channel and video metadata. It was crawled using a pool of English-speaking channels with more than 10k subscribers (retrieved from [`channelcrawler.com`]( https://channelcrawler.com/ )). It provides a snapshot of YouTube data at the end of 2019.

The data as already been preprocessed and cleaned internally and is available as a 6.4gb feather DataFrame, so it is directly usable for visualization purposes and allows for further data exploration.

### 1.2 Problematic

The main idea is to provide a highly interactive visualization of YouTube data to accompany a paper submission from a [Ph.D. student at dlab]( https://manoelhortaribeiro.github.io/ ). The research is still in its early stage but we aim to conduct a large scale longitudinal study examining the metadata of English speaking YouTuber's videos over time. The research questions* are:

1. What are the kinds of content and formats that prospered on YouTube through the years?
2. How have content creation practices changed through years on YouTube?

The main challenge will be to provide a way to explore the different axes: categories, number of likes, duration of the video, ... in an interactive manner and provide ways to compare the trends across time.

*\* Original unmodified research questions*

### 1.3 Exploratory Data Analysis

The Exploratory Data Analysis is available in the [DataOverview notebook](notebooks/DataOverview.ipynb). A summary is provided here:

- There are 69.9mio videos from about 144k channels.
- The dataset span from July 14th 2005 to November 11th 2019.
- The videos are divided into 7 categories: (Entertainment, Gaming, Others, News & Politics, Music, Education, Science & Tech, Howto & Style)
- The important columns are:

| Columns                     | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| categories *(str)*          | Category of the video                                        |
| channel_id *(str)*          | Unique identifier of the channel. Can be mapped to the original channel: `youtube.com/channel/${channel_id}` |
| display_id *(str)*          | Unique identifier of the video. Can be mapped to the original video: `youtu.be/${display.id}` |
| like_count *(int)*          | Number of likes on the video                                 |
| dislike_count *(int)*       | Number of dislikes on the video                              |
| duration *(int)*            | Duration of the video in seconds                             |
| view_count *(int)*          | Number of views of the video                                 |
| upload_date *(ns_datetime)* | Date of upload                                               |


### 1.4 Related Work

As this dataset has not yet been released, there is no published work on this data. At this time, some static distribution plots have been produced for the underlying study:
- Videos/nb of views/active channels/duration at the year level and category level
- A heatmap of %videos posted per day at year and month level for the Entertainment and News & Politics category

To the extent of our knowledge, little is known about *what content* has prospered on the platform through the years, as well as how *the process of creating content* for YouTube has evolved. Thus the current approach of studying the longitudinal data of YouTube is inherently original. We propose additional sketch of visualizations in part 3 of the [DataOverview notebook](notebooks/DataOverview.ipynb).


### Questions to the reviewer

- Do you have suggestions on how to handle large data in D3.js? It seems rather unrealistic to load all the dataframe in memory in a browser.


## Milestone 2 (Friday 1st May, 5pm)

**10% of the final grade**


## Milestone 3 (Thursday 28th May, 5pm)

**80% of the final grade**