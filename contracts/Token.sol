pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    mapping(address => bool) public bridges;

    constructor() ERC20("BridgeToken", "BTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // 1 миллион токенов создателю
    }

    function addBridge(address bridge) external onlyOwner {
        bridges[bridge] = true;
    }

    function removeBridge(address bridge) external onlyOwner {
        bridges[bridge] = false;
    }

    function mint(address to, uint256 amount) external {
        require(bridges[msg.sender], "Only bridge can mint");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
