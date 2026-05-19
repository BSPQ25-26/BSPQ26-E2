package com.bspq.e2.config;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

class LoggingConfigurationTest {

    private static final Logger logger = LoggerFactory.getLogger(LoggingConfigurationTest.class);

    @Test
    void testsUseSlf4jLogger() {
        logger.info("Verifying SLF4J logging is available for the test suite");

        assertThat(logger.isInfoEnabled()).isTrue();
    }
}
