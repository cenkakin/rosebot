package com.github.cenkakin.rosebot

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class RosebotApplication

fun main(args: Array<String>) {
	runApplication<RosebotApplication>(*args)
}
