# Tectonic Explorer Shared Helpers

Note that this directory contains helpers that are used both by the Tectonic Explorer app and the
TecRock table question interactive: https://github.com/concord-consortium/question-interactives/tree/master/packages/tecrock-table

Note that it should be fully self-contained and do NOT include any dependencies specified outside
the `js/shared` directory. This might dramatically increase package size and it might also break
build system and the way how the package is consumed on the other end (TecRock tables), for example
by trying to resolve unsupported asset type.
