package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.dto.ArticleRequest
import com.github.cenkakin.rosebot.dto.ArticleResponse
import com.github.cenkakin.rosebot.service.ArticleService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/articles")
class ArticleController(private val service: ArticleService) {

    @GetMapping
    fun listAll(): List<ArticleResponse> = service.findAll()

    @GetMapping("/{id}")
    fun getOne(@PathVariable id: Long): ArticleResponse = service.findById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: ArticleRequest): ArticleResponse = service.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody request: ArticleRequest): ArticleResponse =
        service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) = service.delete(id)

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ResponseEntity<Map<String, String>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to (ex.message ?: "Not found")))
}
