package com.github.cenkakin.rosebot.source

internal fun SourceType.toJooqEnum(): jooq.enums.SourceType = jooq.enums.SourceType.valueOf(name)
