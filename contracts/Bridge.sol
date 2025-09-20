pragma solidity ^0.8.20;

interface IToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

contract Bridge {
    IToken public token;
    address public owner;
    uint256 public nonce;
    
    mapping(uint256 => bool) public processedNonces;
    
    event Transfer(
        address from,
        address to,
        uint256 amount,
        uint256 nonce,
        uint256 chainId
    );
    
    constructor(address _token) {
        token = IToken(_token);
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function deposit(uint256 amount, address to, uint256 targetChain) external {
        nonce++;
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        token.burn(amount);
        
        emit Transfer(msg.sender, to, amount, nonce, targetChain);
    }
    
    // Сервер вызывает эту функцию для выдачи токенов
    function mint(address to, uint256 amount, uint256 otherChainNonce) external onlyOwner {
        require(!processedNonces[otherChainNonce], "Already processed");
        processedNonces[otherChainNonce] = true;
        
        token.mint(to, amount);
    }
}
