package com.bspq.e2.performance;

import org.databene.contiperf.PerfTest;
import org.databene.contiperf.Required;
import org.junit.Test;

public class RemotePerformanceSuccessIT extends AbstractRemotePerformanceIT {

    @Test
    @PerfTest(invocations = 60, threads = 4)
    @Required(average = 1200, max = 3000, throughput = 5)
    public void catalogEndpoint_supportsConcurrentRemoteReads() {
        assertCatalogRequestWorks();
    }

    @Test
    @PerfTest(duration = 2000, threads = 3)
    @Required(average = 1200, max = 3000, throughput = 3)
    public void movieStatusEndpoint_supportsDurationBasedRemoteLoad() {
        assertStatusLookupWorks(1L, 1L);
    }

    @Test
    @PerfTest(invocations = 20, threads = 1)
    @Required(average = 1500, max = 3000, throughput = 2)
    public void noteUpdateEndpoint_roundTripsOverHttp() {
        assertNoteUpdateWorks(1L, 1L, "Performance note");
    }
}
