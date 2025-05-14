{
  description = "Node.js environment for HomeServiceCRM";
  
  # Import nixpkgs
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
  
  outputs = { self, nixpkgs }:
  let
    pkgs = nixpkgs.legacyPackages.x86_64-linux;
  in
  {
    devShell.x86_64-linux = pkgs.mkShell {
      buildInputs = [
        pkgs.nodejs
        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
        pkgs.yarn
        pkgs.replitPackages.jest
      ];
      
      shellHook = ''
        export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
          pkgs.libuuid
        ]}
      '';
    };
  }
} 