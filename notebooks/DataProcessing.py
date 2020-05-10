#!/usr/bin/env python
# coding: utf-8

# YouTube - viz Data Processing
"""
Please execute those lines afterwards, update the destination folder
(printf "[" && head -c-2 weekly_data/*.json && printf "]") > ~/code/com-480-project-datavirus/website/data/weekly_data.json
(printf "[" && head -c-2 top_v/*.json && printf "]") > ~/code/com-480-project-datavirus/website/data/top_videos.json
cat weekly_score/*.csv > ~/code/com-480-project-datavirus/website/data/weekly_score.csv
"""

import os
from functools import partial

import numpy as np
import pyspark.sql.functions as F
from pyspark.sql import SparkSession
from pyspark.sql.types import ArrayType, IntegerType, LongType
from pyspark.sql.window import Window

os.environ["ARROW_PRE_0_15_IPC_FORMAT"] = "1"

spark = (
    SparkSession.builder.master("local[24]")
    .appName("YouTubeVizLocal")
    .config("spark.driver.memory", "16g")
    .config("spark.executor.memory", "32g")
    .getOrCreate()
)

df = spark.read.parquet("/scratch/tvaucher/data/helper.parquet.gzip")
cats = df.select("categories").distinct().collect()
all_cat = sorted([x["categories"] for x in cats])
start_date = "2008-01-07"
end_date = "2019-06-30"


min_weight = df.agg(F.min("weight")).collect()[0]["min(weight)"]
upper_quantile = df.stat.approxQuantile("weight", [0.75], 0.5)[0]


@F.pandas_udf("integer", F.PandasUDFType.SCALAR)
def scale(x):
    return (x.clip(0, upper_quantile) / (min_weight)).round().astype(int)


scaled = (
    df.select(
        "categories",
        "view_count",
        "display_id",
        "duration",
        "like_count",
        "dislike_count",
        scale("weight").alias("weight"),
        "upload_date",
    )
    .filter(F.col("upload_date").between(start_date, end_date))
    .cache()
)


@F.pandas_udf("integer", F.PandasUDFType.GROUPED_AGG)
def _sum(x):
    return x.sum() // 1e6


@F.pandas_udf("integer", F.PandasUDFType.GROUPED_AGG)
def _count(x):
    return len(x)


def histogram(values, bins=20):
    y, x = np.histogram(values, bins=bins)
    return [y.tolist(), x.tolist()]


hist_duration = F.pandas_udf(
    partial(histogram, bins=np.linspace(0, 1800, 31)),
    ArrayType(ArrayType(IntegerType())),
    F.PandasUDFType.GROUPED_AGG,
)
hist_v_count = F.pandas_udf(
    partial(histogram, bins=np.logspace(0, 32, 33, base=2)),
    ArrayType(ArrayType(LongType())),
    F.PandasUDFType.GROUPED_AGG,
)
hist_l_count = F.pandas_udf(
    partial(histogram, bins=np.logspace(0, 25, 26, base=2)),
    ArrayType(ArrayType(LongType())),
    F.PandasUDFType.GROUPED_AGG,
)
hist_d_count = F.pandas_udf(
    partial(histogram, bins=np.logspace(0, 25, 26, base=2)),
    ArrayType(ArrayType(LongType())),
    F.PandasUDFType.GROUPED_AGG,
)

w = Window().partitionBy("date", "categories").orderBy(F.desc("view_count"))
top_v = (
    scaled.withColumn("date", F.date_trunc("week", "upload_date"))
    .select(
        "date",
        "categories",
        "display_id",
        "view_count",
        "like_count",
        "dislike_count",
        "duration",
        F.rank().over(w).alias("rank"),
    )
    .filter("rank <= 5")
    .drop("rank")
    # .groupBy("date", "categories")
    # .agg(
    #     F.collect_list(
    #         F.struct(
    #             "display_id", "view_count", "like_count", "dislike_count", "duration"
    #         )
    #     ).alias("best_videos")
    # )
    .orderBy("date", "categories")
)

top_v.coalesce(1).write.json(
    "top_v", mode="overwrite", timestampFormat="yyyy-MM-dd", lineSep=",\n"
)

weekly_data = (
    scaled.withColumn("date", F.date_trunc("week", "upload_date"))
    .withColumn("score", scaled.view_count * scaled.weight)
    .groupBy("date", "categories")
    .agg(
        _sum("score").alias("score"),
        _count("display_id").alias("count"),
        hist_v_count("view_count").alias("view_count"),
        hist_l_count("like_count").alias("like_count"),
        hist_d_count("dislike_count").alias("dislike_count"),
    )
    # .join(top_v, on=["date", "categories"])
    # .groupBy("date")
    # .pivot("categories", all_cat)
    # .agg(
    #     F.struct(
    #         F.first("data").alias("data"), F.first("best_videos").alias("best_videos")
    #     )
    # )
    .orderBy("date", "categories")
    .cache()
)

weekly_data.coalesce(1).write.json(
    "weekly_data", mode="overwrite", timestampFormat="yyyy-MM-dd", lineSep=",\n"
)

weekly_score = (
    weekly_data.groupBy("date")
    .pivot("categories", all_cat)
    .agg(F.first("score").alias("score"))
    .orderBy("date")
)

weekly_score.coalesce(1).write.csv(
    "weekly_score",
    mode="overwrite",
    timestampFormat="yyyy-MM-dd",
    header=True,
    nullValue=0,
)
