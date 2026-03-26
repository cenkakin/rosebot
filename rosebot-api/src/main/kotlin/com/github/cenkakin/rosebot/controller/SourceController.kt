package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.source.SourceService
import com.github.cenkakin.rosebot.source.dto.SourceRequest
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import com.github.cenkakin.rosebot.source.dto.UpdateSourceRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/sources")
class SourceController(
    private val service: SourceService,
) {
    @GetMapping
    fun listAll(): List<SourceResponse> = service.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @Valid @RequestBody request: SourceRequest,
    ): SourceResponse = service.create(request)

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateSourceRequest,
    ): SourceResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable id: Long,
    ) = service.delete(id)
}
