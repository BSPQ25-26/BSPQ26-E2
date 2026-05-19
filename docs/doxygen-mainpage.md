# MovieTrakk Remote Documentation

MovieTrakk is a Spring Boot movie tracking application. The production
application exposes HTTP endpoints, and the documented RMI contract in
`com.bspq.e2.rmi.MovieTrakkRmi` captures the same remote boundary for the
Doxygen deliverable.

The generated Doxygen site documents:

- the RMI contract and its remote operations;
- controller entry points for authentication, movies, personal lists and stats;
- DTOs and model classes that cross the remote boundary.

The PDF generated from this documentation is copied to
`docs/doxygen/MovieTrakk-Doxygen.pdf` by the Doxygen scripts and CI workflows.
