{pkgs}: {
  deps = [
    pkgs.ocamlPackages.ocaml_sqlite3
    pkgs.sqlite
    pkgs.haskellPackages.express
   ];
}
