{
  description = "Node.js environment for HomeServiceCRM";
  
  deps = [
    pkgs.nodejs
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
  
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.libuuid
    ];
  };
} 