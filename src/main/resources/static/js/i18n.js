(function (scope) {
    const STORAGE_KEY = "movieTrakk.language";
    const DEFAULT_LANGUAGE = "en";
    const LANGUAGE_CHANGED_EVENT = "movietrakk:languagechange";
    const LANGUAGES = {
        en: {
            code: "EN",
            htmlLang: "en",
            label: "English"
        },
        es: {
            code: "ES",
            htmlLang: "es",
            label: "Castellano"
        },
        eu: {
            code: "EU",
            htmlLang: "eu",
            label: "Euskara"
        }
    };

    const TRANSLATIONS = {
        en: {
            "language.selector": "Language",
            "language.selector.aria": "Select language",
            "language.current": "Language: {code}",
            "language.en": "English",
            "language.es": "Castellano",
            "language.eu": "Euskara",

            "common.appName": "MovieTrakk",
            "common.catalog": "Catalog",
            "common.myLists": "My Lists",
            "common.admin": "Admin",
            "common.logout": "Log out",
            "common.session": "Session:",
            "common.guest": "Guest",
            "common.userRole": "USER",
            "common.backToCatalog": "Back to Catalog",
            "common.loading": "Loading...",
            "common.movie": "Movie",
            "common.movieLower": "movie",
            "common.moviePoster": "Movie poster",
            "common.posterAlt": "{title} poster",
            "common.noPoster": "No Poster",
            "common.untitled": "Untitled",
            "common.unknown": "Unknown",
            "common.unknownGenre": "Unknown Genre",
            "common.notAvailable": "N/A",
            "common.toBeDefined": "TBD",
            "common.noSynopsis": "No synopsis available.",
            "common.requestFailed": "Request failed",
            "common.errorPrefix": "Error: {message}",

            "genres.all": "All genres",
            "genres.Action": "Action",
            "genres.Adventure": "Adventure",
            "genres.Comedy": "Comedy",
            "genres.Drama": "Drama",
            "genres.Fantasy": "Fantasy",
            "genres.Horror": "Horror",
            "genres.Noir": "Noir",
            "genres.Sci-Fi": "Sci-Fi",
            "genres.Thriller": "Thriller",

            "auth.login.title": "Login - MovieTrakk",
            "auth.login.brandAria": "Brand section",
            "auth.login.brandLabel": "Elite Cinematic Experience",
            "auth.login.lead": "Track every title, curate your favorites, and manage your private screening room in one place.",
            "auth.login.featureCatalog": "Curated premium movie catalog",
            "auth.login.featureAdmin": "Role-based admin workflows",
            "auth.login.featureInterface": "Cinematic dark-room interface",
            "auth.login.formAria": "Authentication form",
            "auth.login.welcome": "Welcome Back",
            "auth.login.heading": "Enter Screening Room",
            "auth.login.username": "Username",
            "auth.login.password": "Password",
            "auth.login.submit": "Log in",
            "auth.login.noAccount": "I do not have an account",
            "auth.status.signingIn": "Signing in...",
            "auth.status.loginSuccessful": "Login successful",
            "auth.status.redirecting": "Redirecting...",

            "auth.register.title": "Register - MovieTrakk",
            "auth.register.brandAria": "Brand section",
            "auth.register.brandLabel": "Create Your Profile",
            "auth.register.headingHero": "Build Your MovieTrakk Profile",
            "auth.register.lead": "Join the premium community and start collecting every movie that shapes your watchlist.",
            "auth.register.featureSetup": "Fast account setup",
            "auth.register.featureTracking": "Personalized tracking workflow",
            "auth.register.featureVisual": "Premium visual experience",
            "auth.register.formAria": "Registration form",
            "auth.register.member": "New Member",
            "auth.register.heading": "Create Account",
            "auth.register.username": "Username",
            "auth.register.email": "Email",
            "auth.register.password": "Password",
            "auth.register.submit": "Create account",
            "auth.register.hasAccount": "I already have an account",
            "auth.status.creatingAccount": "Creating account...",

            "catalog.title": "Catalog - MovieTrakk",
            "catalog.subtitle": "Premium movie catalog",
            "catalog.filtersAria": "Catalog filters",
            "catalog.searchControls": "Search Controls",
            "catalog.findNext": "Find the next screening",
            "catalog.titleLabel": "Title",
            "catalog.titlePlaceholder": "Search by title...",
            "catalog.genreLabel": "Genre",
            "catalog.yearLabel": "Year",
            "catalog.yearPlaceholder": "e.g. 2024",
            "catalog.heading": "Movie Catalog",
            "catalog.recommendationsAria": "Recommended movies",
            "catalog.recommendationsHeading": "Recommended for you",
            "catalog.recommendationsCopy": "Based on movies you liked.",
            "catalog.cardsAria": "Movie cards",
            "catalog.empty": "No movies found for current filters.",
            "catalog.edit": "Edit",
            "catalog.delete": "Delete",

            "lists.title": "My Lists - MovieTrakk",
            "lists.subtitle": "My library",
            "lists.heading": "My Lists",
            "lists.copy": "Choose which collection you want to see.",
            "lists.filtersAria": "Movie list filters",
            "lists.watched": "Watched",
            "lists.watchLater": "Watch Later",
            "lists.liked": "Liked",
            "lists.disliked": "Disliked",
            "lists.collections": "My Collections",
            "lists.collectionsCopy": "View your personal movie library organized by status.",
            "lists.gridAria": "My movie lists",
            "lists.empty": "No movies in this list.",
            "lists.invalidSession": "Invalid user session. Please log in again.",
            "lists.loadingError": "Error loading {listType} list: {message}",
            "lists.unknownError": "Unknown error",
            "lists.outdatedSession": "Your session is outdated. Please log in again.",
            "lists.moviesAreaMissing": "Movies area not found in page.",

            "details.title": "Movie Details - MovieTrakk",
            "details.backdropAlt": "Backdrop",
            "details.posterAlt": "Movie Poster",
            "details.titleFallback": "Movie Title",
            "details.synopsisFallback": "Movie synopsis goes here. It provides a detailed overview of the film's plot, setting the stage for the user to decide if they want to watch it.",
            "details.watchLater": "Watch Later",
            "details.watched": "Watched",
            "details.like": "Like",
            "details.dislike": "Dislike",
            "details.notes": "My Notes",
            "details.notePlaceholder": "Write your personal thoughts about this movie...",
            "details.saveNotes": "Save Notes",
            "details.loading": "Loading movie details...",
            "details.oops": "Oops!",
            "details.notFound": "Movie not found.",
            "details.noMovieId": "No movie ID specified.",
            "details.loadFailed": "Failed to load movie details.",
            "details.statusUpdated": "Status updated successfully",
            "details.statusFailed": "Failed to update status",
            "details.saving": "Saving...",
            "details.noteSaved": "Note saved successfully",
            "details.noteFailed": "Failed to save note",

            "admin.title": "Admin Dashboard - MovieTrakk",
            "admin.navigationAria": "Admin navigation",
            "admin.management": "Management",
            "admin.cinemaControl": "Cinema Control",
            "admin.movieLibrary": "Movie Library",
            "admin.addMovie": "Add Movie",
            "admin.addNewMovie": "Add New Movie",
            "admin.searchPlaceholder": "Search movies...",
            "admin.searchFullPlaceholder": "Search by title, genre, synopsis...",
            "admin.heroLabel": "Movie Library",
            "admin.heroHeading": "Manage the catalog",
            "admin.heroCopy": "Update metadata, curate posters, and keep the cinematic archive ready for every user.",
            "admin.summaryAria": "Catalog summary",
            "admin.totalMovies": "Total movies",
            "admin.genres": "Genres",
            "admin.newestYear": "Newest year",
            "admin.averageRuntime": "Average runtime",
            "admin.filtersAria": "Admin filters",
            "admin.searchMovies": "Search movies",
            "admin.genre": "Genre",
            "admin.year": "Year",
            "admin.anyYear": "Any year",
            "admin.sort": "Sort",
            "admin.sortTitle": "Title A-Z",
            "admin.sortNewest": "Newest first",
            "admin.sortOldest": "Oldest first",
            "admin.sortGenre": "Genre",
            "admin.sortRuntime": "Runtime",
            "admin.clear": "Clear",
            "admin.tableAria": "Admin movie table",
            "admin.poster": "Poster",
            "admin.movieTitle": "Title",
            "admin.runtime": "Runtime",
            "admin.actions": "Actions",
            "admin.noEntries": "No entries",
            "admin.paginationAria": "Pagination",
            "admin.previousPage": "Previous page",
            "admin.nextPage": "Next page",
            "admin.modalAria": "Movie editor",
            "admin.movieDetails": "Movie details",
            "admin.editMovie": "Edit Movie",
            "admin.closeEditor": "Close editor",
            "admin.posterPreview": "Poster preview",
            "admin.posterUrl": "Poster URL",
            "admin.posterUrlPlaceholder": "https://example.com/poster.jpg",
            "admin.durationMin": "Duration (min)",
            "admin.synopsis": "Synopsis",
            "admin.synopsisPlaceholder": "Short plot summary",
            "admin.reset": "Reset",
            "admin.cancel": "Cancel",
            "admin.saveMovie": "Save Movie",
            "admin.newCatalogEntry": "New catalog entry",
            "admin.movieNumber": "Movie #{id}",
            "admin.noMoviesFound": "No movies found",
            "admin.adjustFilters": "Adjust filters or add a new movie.",
            "admin.showingEntries": "Showing {start} to {end} of {total} entries",
            "admin.accessRequired": "Admin access required",
            "admin.loginAdmin": "Log in with an admin account to manage movies.",
            "admin.roleRequired": "Admin role required to access this page.",
            "admin.movieNotFound": "Movie not found",
            "admin.editingMovie": "Editing movie #{id}",
            "admin.selectMovieToEdit": "Select a movie to edit",
            "admin.deletingMovie": "Deleting {title}...",
            "admin.deletedMovie": "Deleted {title}",
            "admin.updatedMovie": "Updated {title}",
            "admin.createdMovie": "Created {title}",
            "admin.completeRequired": "Complete the required movie fields.",
            "admin.requiredPayload": "Title, genre, year, and duration are required."
        },
        es: {
            "language.selector": "Idioma",
            "language.selector.aria": "Seleccionar idioma",
            "language.current": "Idioma: {code}",
            "language.en": "English",
            "language.es": "Castellano",
            "language.eu": "Euskara",

            "common.appName": "MovieTrakk",
            "common.catalog": "Catálogo",
            "common.myLists": "Mis listas",
            "common.admin": "Admin",
            "common.logout": "Cerrar sesión",
            "common.session": "Sesión:",
            "common.guest": "Invitado",
            "common.userRole": "USUARIO",
            "common.backToCatalog": "Volver al catálogo",
            "common.loading": "Cargando...",
            "common.movie": "Película",
            "common.movieLower": "película",
            "common.moviePoster": "Cartel de la película",
            "common.posterAlt": "Cartel de {title}",
            "common.noPoster": "Sin cartel",
            "common.untitled": "Sin título",
            "common.unknown": "Desconocido",
            "common.unknownGenre": "Género desconocido",
            "common.notAvailable": "N/D",
            "common.toBeDefined": "Pendiente",
            "common.noSynopsis": "Sin sinopsis disponible.",
            "common.requestFailed": "La solicitud ha fallado",
            "common.errorPrefix": "Error: {message}",

            "genres.all": "Todos los géneros",
            "genres.Action": "Acción",
            "genres.Adventure": "Aventura",
            "genres.Comedy": "Comedia",
            "genres.Drama": "Drama",
            "genres.Fantasy": "Fantasía",
            "genres.Horror": "Terror",
            "genres.Noir": "Noir",
            "genres.Sci-Fi": "Ciencia ficción",
            "genres.Thriller": "Thriller",

            "auth.login.title": "Iniciar sesión - MovieTrakk",
            "auth.login.brandAria": "Sección de marca",
            "auth.login.brandLabel": "Experiencia cinematográfica de élite",
            "auth.login.lead": "Registra cada título, organiza tus favoritos y gestiona tu sala privada de cine en un único lugar.",
            "auth.login.featureCatalog": "Catálogo premium de películas seleccionado",
            "auth.login.featureAdmin": "Flujos de administración por roles",
            "auth.login.featureInterface": "Interfaz cinematográfica de sala oscura",
            "auth.login.formAria": "Formulario de autenticación",
            "auth.login.welcome": "Bienvenido de nuevo",
            "auth.login.heading": "Entra en la sala",
            "auth.login.username": "Nombre de usuario",
            "auth.login.password": "Contraseña",
            "auth.login.submit": "Iniciar sesión",
            "auth.login.noAccount": "No tengo cuenta",
            "auth.status.signingIn": "Iniciando sesión...",
            "auth.status.loginSuccessful": "Inicio de sesión correcto",
            "auth.status.redirecting": "Redirigiendo...",

            "auth.register.title": "Registro - MovieTrakk",
            "auth.register.brandAria": "Sección de marca",
            "auth.register.brandLabel": "Crea tu perfil",
            "auth.register.headingHero": "Construye tu perfil de MovieTrakk",
            "auth.register.lead": "Únete a la comunidad premium y empieza a guardar cada película que da forma a tu lista.",
            "auth.register.featureSetup": "Creación rápida de cuenta",
            "auth.register.featureTracking": "Seguimiento personalizado",
            "auth.register.featureVisual": "Experiencia visual premium",
            "auth.register.formAria": "Formulario de registro",
            "auth.register.member": "Nuevo miembro",
            "auth.register.heading": "Crear cuenta",
            "auth.register.username": "Nombre de usuario",
            "auth.register.email": "Correo electrónico",
            "auth.register.password": "Contraseña",
            "auth.register.submit": "Crear cuenta",
            "auth.register.hasAccount": "Ya tengo cuenta",
            "auth.status.creatingAccount": "Creando cuenta...",

            "catalog.title": "Catálogo - MovieTrakk",
            "catalog.subtitle": "Catálogo premium de películas",
            "catalog.filtersAria": "Filtros del catálogo",
            "catalog.searchControls": "Controles de búsqueda",
            "catalog.findNext": "Encuentra la próxima sesión",
            "catalog.titleLabel": "Título",
            "catalog.titlePlaceholder": "Buscar por título...",
            "catalog.genreLabel": "Género",
            "catalog.yearLabel": "Año",
            "catalog.yearPlaceholder": "p. ej. 2024",
            "catalog.heading": "Catálogo de películas",
            "catalog.recommendationsAria": "Películas recomendadas",
            "catalog.recommendationsHeading": "Recomendadas para ti",
            "catalog.recommendationsCopy": "Basado en las películas que te han gustado.",
            "catalog.cardsAria": "Tarjetas de películas",
            "catalog.empty": "No se han encontrado películas con los filtros actuales.",
            "catalog.edit": "Editar",
            "catalog.delete": "Eliminar",

            "lists.title": "Mis listas - MovieTrakk",
            "lists.subtitle": "Mi biblioteca",
            "lists.heading": "Mis listas",
            "lists.copy": "Elige qué colección quieres ver.",
            "lists.filtersAria": "Filtros de listas de películas",
            "lists.watched": "Vistas",
            "lists.watchLater": "Ver más tarde",
            "lists.liked": "Me gustan",
            "lists.disliked": "No me gustan",
            "lists.collections": "Mis colecciones",
            "lists.collectionsCopy": "Consulta tu biblioteca personal organizada por estado.",
            "lists.gridAria": "Mis listas de películas",
            "lists.empty": "No hay películas en esta lista.",
            "lists.invalidSession": "Sesión de usuario no válida. Vuelve a iniciar sesión.",
            "lists.loadingError": "Error al cargar la lista {listType}: {message}",
            "lists.unknownError": "Error desconocido",
            "lists.outdatedSession": "Tu sesión ha caducado. Vuelve a iniciar sesión.",
            "lists.moviesAreaMissing": "No se ha encontrado el área de películas en la página.",

            "details.title": "Detalles de película - MovieTrakk",
            "details.backdropAlt": "Imagen de fondo",
            "details.posterAlt": "Cartel de la película",
            "details.titleFallback": "Título de la película",
            "details.synopsisFallback": "La sinopsis de la película se mostrará aquí.",
            "details.watchLater": "Ver más tarde",
            "details.watched": "Vista",
            "details.like": "Me gusta",
            "details.dislike": "No me gusta",
            "details.notes": "Mis notas",
            "details.notePlaceholder": "Escribe tus ideas personales sobre esta película...",
            "details.saveNotes": "Guardar notas",
            "details.loading": "Cargando detalles de la película...",
            "details.oops": "Vaya",
            "details.notFound": "Película no encontrada.",
            "details.noMovieId": "No se ha indicado ningún ID de película.",
            "details.loadFailed": "No se han podido cargar los detalles de la película.",
            "details.statusUpdated": "Estado actualizado correctamente",
            "details.statusFailed": "No se ha podido actualizar el estado",
            "details.saving": "Guardando...",
            "details.noteSaved": "Nota guardada correctamente",
            "details.noteFailed": "No se ha podido guardar la nota",

            "admin.title": "Panel de administración - MovieTrakk",
            "admin.navigationAria": "Navegación de administración",
            "admin.management": "Gestión",
            "admin.cinemaControl": "Control de cine",
            "admin.movieLibrary": "Biblioteca de películas",
            "admin.addMovie": "Añadir película",
            "admin.addNewMovie": "Añadir nueva película",
            "admin.searchPlaceholder": "Buscar películas...",
            "admin.searchFullPlaceholder": "Buscar por título, género o sinopsis...",
            "admin.heroLabel": "Biblioteca de películas",
            "admin.heroHeading": "Gestiona el catálogo",
            "admin.heroCopy": "Actualiza metadatos, cuida los carteles y mantén el archivo cinematográfico listo para cada usuario.",
            "admin.summaryAria": "Resumen del catálogo",
            "admin.totalMovies": "Películas totales",
            "admin.genres": "Géneros",
            "admin.newestYear": "Año más reciente",
            "admin.averageRuntime": "Duración media",
            "admin.filtersAria": "Filtros de administración",
            "admin.searchMovies": "Buscar películas",
            "admin.genre": "Género",
            "admin.year": "Año",
            "admin.anyYear": "Cualquier año",
            "admin.sort": "Orden",
            "admin.sortTitle": "Título A-Z",
            "admin.sortNewest": "Más recientes primero",
            "admin.sortOldest": "Más antiguas primero",
            "admin.sortGenre": "Género",
            "admin.sortRuntime": "Duración",
            "admin.clear": "Limpiar",
            "admin.tableAria": "Tabla de películas de administración",
            "admin.poster": "Cartel",
            "admin.movieTitle": "Título",
            "admin.runtime": "Duración",
            "admin.actions": "Acciones",
            "admin.noEntries": "Sin entradas",
            "admin.paginationAria": "Paginación",
            "admin.previousPage": "Página anterior",
            "admin.nextPage": "Página siguiente",
            "admin.modalAria": "Editor de películas",
            "admin.movieDetails": "Detalles de película",
            "admin.editMovie": "Editar película",
            "admin.closeEditor": "Cerrar editor",
            "admin.posterPreview": "Vista previa del cartel",
            "admin.posterUrl": "URL del cartel",
            "admin.posterUrlPlaceholder": "https://ejemplo.com/cartel.jpg",
            "admin.durationMin": "Duración (min)",
            "admin.synopsis": "Sinopsis",
            "admin.synopsisPlaceholder": "Resumen breve de la trama",
            "admin.reset": "Restablecer",
            "admin.cancel": "Cancelar",
            "admin.saveMovie": "Guardar película",
            "admin.newCatalogEntry": "Nueva entrada del catálogo",
            "admin.movieNumber": "Película #{id}",
            "admin.noMoviesFound": "No se han encontrado películas",
            "admin.adjustFilters": "Ajusta los filtros o añade una película nueva.",
            "admin.showingEntries": "Mostrando {start} a {end} de {total} entradas",
            "admin.accessRequired": "Se requiere acceso de administrador",
            "admin.loginAdmin": "Inicia sesión con una cuenta de administrador para gestionar películas.",
            "admin.roleRequired": "Se requiere rol de administrador para acceder a esta página.",
            "admin.movieNotFound": "Película no encontrada",
            "admin.editingMovie": "Editando película #{id}",
            "admin.selectMovieToEdit": "Selecciona una película para editar",
            "admin.deletingMovie": "Eliminando {title}...",
            "admin.deletedMovie": "{title} eliminada",
            "admin.updatedMovie": "{title} actualizada",
            "admin.createdMovie": "{title} creada",
            "admin.completeRequired": "Completa los campos obligatorios de la película.",
            "admin.requiredPayload": "Título, género, año y duración son obligatorios."
        },
        eu: {
            "language.selector": "Hizkuntza",
            "language.selector.aria": "Hizkuntza hautatu",
            "language.current": "Hizkuntza: {code}",
            "language.en": "English",
            "language.es": "Castellano",
            "language.eu": "Euskara",

            "common.appName": "MovieTrakk",
            "common.catalog": "Katalogoa",
            "common.myLists": "Nire zerrendak",
            "common.admin": "Admin",
            "common.logout": "Saioa itxi",
            "common.session": "Saioa:",
            "common.guest": "Gonbidatua",
            "common.userRole": "ERABILTZAILEA",
            "common.backToCatalog": "Itzuli katalogora",
            "common.loading": "Kargatzen...",
            "common.movie": "Filma",
            "common.movieLower": "filma",
            "common.moviePoster": "Filmaren kartela",
            "common.posterAlt": "{title} filmaren kartela",
            "common.noPoster": "Kartelik gabe",
            "common.untitled": "Izenbururik gabe",
            "common.unknown": "Ezezaguna",
            "common.unknownGenre": "Genero ezezaguna",
            "common.notAvailable": "E/E",
            "common.toBeDefined": "Zehazteke",
            "common.noSynopsis": "Ez dago sinopsirik.",
            "common.requestFailed": "Eskaerak huts egin du",
            "common.errorPrefix": "Errorea: {message}",

            "genres.all": "Genero guztiak",
            "genres.Action": "Akzioa",
            "genres.Adventure": "Abentura",
            "genres.Comedy": "Komedia",
            "genres.Drama": "Drama",
            "genres.Fantasy": "Fantasia",
            "genres.Horror": "Beldurrezkoa",
            "genres.Noir": "Noir",
            "genres.Sci-Fi": "Zientzia fikzioa",
            "genres.Thriller": "Thriller",

            "auth.login.title": "Saioa hasi - MovieTrakk",
            "auth.login.brandAria": "Markaren atala",
            "auth.login.brandLabel": "Eliteko zinema-esperientzia",
            "auth.login.lead": "Gorde izenburu guztiak, antolatu gogokoak eta kudeatu zure zinema-gela pribatua leku bakarrean.",
            "auth.login.featureCatalog": "Hautatutako filmen katalogo premiuma",
            "auth.login.featureAdmin": "Rolen araberako administrazio-fluxuak",
            "auth.login.featureInterface": "Gela iluneko zinema-interfazea",
            "auth.login.formAria": "Autentifikazio formularioa",
            "auth.login.welcome": "Ongi etorri berriro",
            "auth.login.heading": "Sartu aretoan",
            "auth.login.username": "Erabiltzaile-izena",
            "auth.login.password": "Pasahitza",
            "auth.login.submit": "Saioa hasi",
            "auth.login.noAccount": "Ez daukat konturik",
            "auth.status.signingIn": "Saioa hasten...",
            "auth.status.loginSuccessful": "Saioa ondo hasi da",
            "auth.status.redirecting": "Birbideratzen...",

            "auth.register.title": "Erregistroa - MovieTrakk",
            "auth.register.brandAria": "Markaren atala",
            "auth.register.brandLabel": "Sortu zure profila",
            "auth.register.headingHero": "Eraiki zure MovieTrakk profila",
            "auth.register.lead": "Sartu komunitate premiumean eta hasi zure zerrenda osatzen duten film guztiak gordetzen.",
            "auth.register.featureSetup": "Kontuaren sorrera azkarra",
            "auth.register.featureTracking": "Jarraipen pertsonalizatua",
            "auth.register.featureVisual": "Ikus-esperientzia premiuma",
            "auth.register.formAria": "Erregistro formularioa",
            "auth.register.member": "Kide berria",
            "auth.register.heading": "Sortu kontua",
            "auth.register.username": "Erabiltzaile-izena",
            "auth.register.email": "Posta elektronikoa",
            "auth.register.password": "Pasahitza",
            "auth.register.submit": "Sortu kontua",
            "auth.register.hasAccount": "Badut kontua",
            "auth.status.creatingAccount": "Kontua sortzen...",

            "catalog.title": "Katalogoa - MovieTrakk",
            "catalog.subtitle": "Filmen katalogo premiuma",
            "catalog.filtersAria": "Katalogoko iragazkiak",
            "catalog.searchControls": "Bilaketa kontrolak",
            "catalog.findNext": "Aurkitu hurrengo emanaldia",
            "catalog.titleLabel": "Izenburua",
            "catalog.titlePlaceholder": "Bilatu izenburuaren arabera...",
            "catalog.genreLabel": "Generoa",
            "catalog.yearLabel": "Urtea",
            "catalog.yearPlaceholder": "adib. 2024",
            "catalog.heading": "Filmen katalogoa",
            "catalog.recommendationsAria": "Gomendatutako filmak",
            "catalog.recommendationsHeading": "Zuretzat gomendatuak",
            "catalog.recommendationsCopy": "Gustuko izan dituzun filmetan oinarrituta.",
            "catalog.cardsAria": "Film txartelak",
            "catalog.empty": "Ez da filmik aurkitu uneko iragazkiekin.",
            "catalog.edit": "Editatu",
            "catalog.delete": "Ezabatu",

            "lists.title": "Nire zerrendak - MovieTrakk",
            "lists.subtitle": "Nire liburutegia",
            "lists.heading": "Nire zerrendak",
            "lists.copy": "Aukeratu zein bilduma ikusi nahi duzun.",
            "lists.filtersAria": "Film zerrenden iragazkiak",
            "lists.watched": "Ikusitakoak",
            "lists.watchLater": "Gero ikusteko",
            "lists.liked": "Gustukoak",
            "lists.disliked": "Gustuko ez ditudanak",
            "lists.collections": "Nire bildumak",
            "lists.collectionsCopy": "Ikusi zure film-liburutegi pertsonala egoeraren arabera antolatuta.",
            "lists.gridAria": "Nire film zerrendak",
            "lists.empty": "Ez dago filmik zerrenda honetan.",
            "lists.invalidSession": "Erabiltzaile-saioa ez da baliozkoa. Hasi saioa berriro.",
            "lists.loadingError": "Errorea {listType} zerrenda kargatzean: {message}",
            "lists.unknownError": "Errore ezezaguna",
            "lists.outdatedSession": "Zure saioa iraungi da. Hasi saioa berriro.",
            "lists.moviesAreaMissing": "Ez da filmen eremua aurkitu orrian.",

            "details.title": "Filmaren xehetasunak - MovieTrakk",
            "details.backdropAlt": "Atzeko irudia",
            "details.posterAlt": "Filmaren kartela",
            "details.titleFallback": "Filmaren izenburua",
            "details.synopsisFallback": "Filmaren sinopsia hemen agertuko da.",
            "details.watchLater": "Gero ikusteko",
            "details.watched": "Ikusita",
            "details.like": "Gustuko dut",
            "details.dislike": "Ez dut gustuko",
            "details.notes": "Nire oharrak",
            "details.notePlaceholder": "Idatzi film honi buruzko zure ideiak...",
            "details.saveNotes": "Gorde oharrak",
            "details.loading": "Filmaren xehetasunak kargatzen...",
            "details.oops": "Ene",
            "details.notFound": "Filma ez da aurkitu.",
            "details.noMovieId": "Ez da filmaren IDrik adierazi.",
            "details.loadFailed": "Ezin izan dira filmaren xehetasunak kargatu.",
            "details.statusUpdated": "Egoera ondo eguneratu da",
            "details.statusFailed": "Ezin izan da egoera eguneratu",
            "details.saving": "Gordetzen...",
            "details.noteSaved": "Oharra ondo gorde da",
            "details.noteFailed": "Ezin izan da oharra gorde",

            "admin.title": "Administrazio panela - MovieTrakk",
            "admin.navigationAria": "Administrazio nabigazioa",
            "admin.management": "Kudeaketa",
            "admin.cinemaControl": "Zinema kontrola",
            "admin.movieLibrary": "Film liburutegia",
            "admin.addMovie": "Gehitu filma",
            "admin.addNewMovie": "Gehitu film berria",
            "admin.searchPlaceholder": "Bilatu filmak...",
            "admin.searchFullPlaceholder": "Bilatu izenburua, generoa edo sinopsia...",
            "admin.heroLabel": "Film liburutegia",
            "admin.heroHeading": "Kudeatu katalogoa",
            "admin.heroCopy": "Eguneratu metadatuak, zaindu kartelak eta mantendu zinema-artxiboa erabiltzaile guztientzat prest.",
            "admin.summaryAria": "Katalogoaren laburpena",
            "admin.totalMovies": "Filmak guztira",
            "admin.genres": "Generoak",
            "admin.newestYear": "Urterik berriena",
            "admin.averageRuntime": "Batez besteko iraupena",
            "admin.filtersAria": "Administrazio iragazkiak",
            "admin.searchMovies": "Bilatu filmak",
            "admin.genre": "Generoa",
            "admin.year": "Urtea",
            "admin.anyYear": "Edozein urte",
            "admin.sort": "Ordena",
            "admin.sortTitle": "Izenburua A-Z",
            "admin.sortNewest": "Berrienak lehenik",
            "admin.sortOldest": "Zaharrenak lehenik",
            "admin.sortGenre": "Generoa",
            "admin.sortRuntime": "Iraupena",
            "admin.clear": "Garbitu",
            "admin.tableAria": "Administrazioko filmen taula",
            "admin.poster": "Kartela",
            "admin.movieTitle": "Izenburua",
            "admin.runtime": "Iraupena",
            "admin.actions": "Ekintzak",
            "admin.noEntries": "Sarrerarik ez",
            "admin.paginationAria": "Orrikatzea",
            "admin.previousPage": "Aurreko orria",
            "admin.nextPage": "Hurrengo orria",
            "admin.modalAria": "Film editorea",
            "admin.movieDetails": "Filmaren xehetasunak",
            "admin.editMovie": "Editatu filma",
            "admin.closeEditor": "Itxi editorea",
            "admin.posterPreview": "Kartelaren aurrebista",
            "admin.posterUrl": "Kartelaren URLa",
            "admin.posterUrlPlaceholder": "https://adibidea.com/kartela.jpg",
            "admin.durationMin": "Iraupena (min)",
            "admin.synopsis": "Sinopsia",
            "admin.synopsisPlaceholder": "Argumentuaren laburpen laburra",
            "admin.reset": "Berrezarri",
            "admin.cancel": "Utzi",
            "admin.saveMovie": "Gorde filma",
            "admin.newCatalogEntry": "Katalogoko sarrera berria",
            "admin.movieNumber": "#{id}. filma",
            "admin.noMoviesFound": "Ez da filmik aurkitu",
            "admin.adjustFilters": "Doitu iragazkiak edo gehitu film berri bat.",
            "admin.showingEntries": "{start} - {end} erakusten, guztira {total} sarrera",
            "admin.accessRequired": "Administratzaile sarbidea behar da",
            "admin.loginAdmin": "Hasi saioa administratzaile-kontu batekin filmak kudeatzeko.",
            "admin.roleRequired": "Administratzaile rola behar da orri honetara sartzeko.",
            "admin.movieNotFound": "Filma ez da aurkitu",
            "admin.editingMovie": "#{id}. filma editatzen",
            "admin.selectMovieToEdit": "Hautatu film bat editatzeko",
            "admin.deletingMovie": "{title} ezabatzen...",
            "admin.deletedMovie": "{title} ezabatu da",
            "admin.updatedMovie": "{title} eguneratu da",
            "admin.createdMovie": "{title} sortu da",
            "admin.completeRequired": "Bete filmaren nahitaezko eremuak.",
            "admin.requiredPayload": "Izenburua, generoa, urtea eta iraupena nahitaezkoak dira."
        }
    };

    function getStoredLanguage(storage = scope.localStorage) {
        try {
            const stored = storage?.getItem(STORAGE_KEY);
            return LANGUAGES[stored] ? stored : DEFAULT_LANGUAGE;
        } catch (_) {
            return DEFAULT_LANGUAGE;
        }
    }

    let currentLanguage = getStoredLanguage();

    function interpolate(text, params) {
        return String(text).replace(/\{(\w+)\}/g, (_, key) => {
            const value = params && params[key];
            return value === undefined || value === null ? "" : String(value);
        });
    }

    function translate(key, options = {}) {
        const params = { ...options };
        const defaultValue = params.defaultValue;
        delete params.defaultValue;

        const dictionary = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
        const fallbackDictionary = TRANSLATIONS[DEFAULT_LANGUAGE] || {};
        const text = dictionary[key] || fallbackDictionary[key] || defaultValue || key;

        return interpolate(text, params);
    }

    function applyTranslations(root = scope.document) {
        const doc = root?.nodeType === 9 ? root : root?.ownerDocument;
        if (!root || !doc) {
            return;
        }

        doc.documentElement.lang = LANGUAGES[currentLanguage].htmlLang;

        const titleElement = doc.querySelector("title[data-i18n]");
        if (titleElement) {
            const translatedTitle = translate(titleElement.dataset.i18n, {
                defaultValue: titleElement.dataset.i18nFallback || titleElement.textContent
            });
            titleElement.textContent = translatedTitle;
            doc.title = translatedTitle;
        }

        root.querySelectorAll("[data-i18n]").forEach((element) => {
            element.textContent = translate(element.dataset.i18n, {
                defaultValue: element.dataset.i18nFallback || element.textContent
            });
        });

        root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
            element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder, {
                defaultValue: element.getAttribute("placeholder") || ""
            }));
        });

        root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
            element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel, {
                defaultValue: element.getAttribute("aria-label") || ""
            }));
        });

        root.querySelectorAll("[data-i18n-alt]").forEach((element) => {
            element.setAttribute("alt", translate(element.dataset.i18nAlt, {
                defaultValue: element.getAttribute("alt") || ""
            }));
        });
    }

    function closeLanguageMenus(doc = scope.document) {
        doc?.querySelectorAll("[data-language-menu]").forEach((menu) => {
            menu.hidden = true;
        });
        doc?.querySelectorAll("[data-language-trigger]").forEach((trigger) => {
            trigger.setAttribute("aria-expanded", "false");
        });
    }

    function updateLanguageSwitcher(doc = scope.document) {
        if (!doc) {
            return;
        }

        doc.querySelectorAll("[data-language-current]").forEach((element) => {
            element.textContent = translate("language.current", {
                code: LANGUAGES[currentLanguage].code
            });
        });

        doc.querySelectorAll("[data-language-trigger]").forEach((trigger) => {
            trigger.setAttribute("aria-label", translate("language.selector.aria"));
        });

        doc.querySelectorAll("[data-language-option]").forEach((button) => {
            const language = button.dataset.languageOption;
            button.classList.toggle("active", language === currentLanguage);
            button.setAttribute("aria-pressed", String(language === currentLanguage));
            button.textContent = translate(`language.${language}`, {
                defaultValue: LANGUAGES[language]?.label || language
            });
        });
    }

    function dispatchLanguageChange(doc = scope.document) {
        const event = typeof scope.CustomEvent === "function"
            ? new scope.CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: { language: currentLanguage } })
            : null;

        if (event) {
            scope.window?.dispatchEvent(event);
            doc?.dispatchEvent(event);
        }
    }

    function setLanguage(language, options = {}) {
        if (!LANGUAGES[language]) {
            return currentLanguage;
        }

        if (language === currentLanguage) {
            closeLanguageMenus();
            updateLanguageSwitcher();
            return currentLanguage;
        }

        currentLanguage = language;
        try {
            scope.localStorage?.setItem(STORAGE_KEY, language);
        } catch (_) {}

        applyTranslations();
        updateLanguageSwitcher();
        closeLanguageMenus();

        if (!options.silent) {
            dispatchLanguageChange();
        }

        return currentLanguage;
    }

    function bindLanguageSwitcher(container) {
        const trigger = container.querySelector("[data-language-trigger]");
        const menu = container.querySelector("[data-language-menu]");

        trigger?.addEventListener("click", (event) => {
            event.stopPropagation();
            const expanded = trigger.getAttribute("aria-expanded") === "true";
            closeLanguageMenus(container.ownerDocument);
            menu.hidden = expanded;
            trigger.setAttribute("aria-expanded", String(!expanded));
        });

        menu?.addEventListener("click", (event) => {
            const option = event.target.closest("[data-language-option]");
            if (!option) {
                return;
            }
            setLanguage(option.dataset.languageOption);
        });
    }

    function ensureLanguageSwitcher(doc = scope.document) {
        if (!doc || doc.querySelector("[data-language-switcher]")) {
            return;
        }

        const container = doc.createElement("div");
        container.className = "language-switcher";
        container.dataset.languageSwitcher = "true";
        container.innerHTML = `
            <button type="button" class="language-trigger" data-language-trigger aria-haspopup="true" aria-expanded="false">
                <span class="material-symbols-outlined" aria-hidden="true">language</span>
                <span data-language-current></span>
            </button>
            <div class="language-menu" data-language-menu hidden>
                <button type="button" data-language-option="en"></button>
                <button type="button" data-language-option="es"></button>
                <button type="button" data-language-option="eu"></button>
            </div>
        `;

        const target = doc.querySelector(".session-wrap") || doc.body;
        if (target === doc.body) {
            container.classList.add("is-floating");
        }
        target.append(container);
        bindLanguageSwitcher(container);
        updateLanguageSwitcher(doc);
    }

    function init(doc = scope.document) {
        ensureLanguageSwitcher(doc);
        applyTranslations(doc);
        updateLanguageSwitcher(doc);
        doc?.addEventListener("click", () => closeLanguageMenus(doc));
    }

    const exportsObject = {
        STORAGE_KEY,
        DEFAULT_LANGUAGE,
        LANGUAGE_CHANGED_EVENT,
        LANGUAGES,
        TRANSLATIONS,
        getLanguage: () => currentLanguage,
        setLanguage,
        t: translate,
        applyTranslations,
        init
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = exportsObject;
    }

    if (scope && typeof scope.window !== "undefined") {
        scope.window.MovieI18n = exportsObject;
        if (scope.document?.readyState === "loading") {
            scope.document.addEventListener("DOMContentLoaded", () => init());
        } else {
            init();
        }
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
