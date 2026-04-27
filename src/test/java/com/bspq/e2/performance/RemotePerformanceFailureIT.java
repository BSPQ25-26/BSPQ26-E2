package com.bspq.e2.performance;

import org.databene.contiperf.PerfTest;
import org.databene.contiperf.Required;
import org.junit.Test;

public class RemotePerformanceFailureIT extends AbstractRemotePerformanceIT {

    @Test
    @PerfTest(invocations = 20, threads = 2)
    @Required(average = 1, max = 2, throughput = 5000)
    public void catalogEndpoint_failsWhenThresholdsAreUnrealistic() {
        assertMovieLookupWorks(1L);
    }
}
