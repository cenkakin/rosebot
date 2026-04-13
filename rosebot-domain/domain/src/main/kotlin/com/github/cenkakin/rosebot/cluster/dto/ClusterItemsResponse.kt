package com.github.cenkakin.rosebot.cluster.dto

import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse

data class ClusterItemsResponse(
    val items: List<FeedItemResponse>,
)
