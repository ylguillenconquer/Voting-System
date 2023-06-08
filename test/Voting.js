const { expect } = require("chai");

describe("Voting", function () { 

    let proposalNames;
    let votersAddresses;
    let voting;

    this.beforeEach(async function () {
        proposalNames = ["Proposal1", "Proposal2", "Proposal3"];
        [addr0, addr1, addr2, addr3, addr4, addr5, addr6, addr7]= await ethers.getSigners();
        votersAddresses = [addr0.address, addr1.address, addr2.address, addr3.address, addr4.address, addr5.address, addr6.address];
        
        const Voting = await hre.ethers.getContractFactory("Voting");
        voting = await Voting.deploy(proposalNames, votersAddresses);

        await voting.deployed();
    });

    function removeNullBytes(str) {
        return str.split("").filter(char => char.codePointAt(0)).join("");
    }

    describe ("Deployment", function() {
        it ("Should set the right value of the proposals", async function (){
          for (let i = 0; i<proposalNames.length; i++) {
            let prop = await voting.getProposal(i);
            await expect(removeNullBytes(prop[0])).to.equal(proposalNames[i]);
          }
          });

          it ("Should set the right value of the voter addresses", async function (){
            for (let i = 0; i<votersAddresses.length; i++) {
              let voterAddr = await voting.voters(votersAddresses[i]);
              await expect(voterAddr.voter).to.equal(votersAddresses[i]);
            }

        });
    })

    describe ("Vote", function() { 
        it ("Shouldn't vote", async function (){
            await expect(voting.vote(votersAddresses[1], 1)).to.be.revertedWith("Voting System: This address does not have right to vote");
        });
        it ("Should vote", async function (){
            await expect(voting.vote(votersAddresses[0], 1)).not.to.be.reverted;
        });

    })

    describe ("Delegate", function() {
        it ("Shouldn`t delegate, self delegation", async function (){
            await expect(voting.delegate(votersAddresses[0])).to.be.revertedWith("Voting System: Self delegation is not allowed");
        });

        it ("Shouldn't delegate, user had already vote", async function (){
            await voting.vote(votersAddresses[0], 1);
            await expect(voting.delegate(votersAddresses[1])).to.be.revertedWith("Voting System: The voter has already voted");
        });

        it("Shouldn't delegate, this address dont have the right to vote", async function() {
            await expect(voting.connect(addr7).delegate(votersAddresses[1])).to.be.revertedWith("Voting System: This address does not have right to vote");
        })

        it("Should delegate", async function () {
            await expect(voting.delegate(votersAddresses[1])).not.to.be.reverted;
            let voterAddr = await voting.voters(votersAddresses[0]);
            await expect(voterAddr.delegate).to.equal(votersAddresses[1]);
        });
        
    });

    describe ("Vote", function() {
        it ("Shouldn`t vote, this proposal doesn't exist", async function (){
            await expect(voting.vote(votersAddresses[0], 8)).to.be.revertedWith("Voting System: Proposal index out of bounds");
        });

        it ("Shouldn`t vote, this voter has already voted", async function (){
            await voting.vote(votersAddresses[0], 1);
            await expect(voting.vote(votersAddresses[0], 1)).to.be.revertedWith("Voting System: The voter has already voted");
        });

        it ("Shouldn`t vote, this address does not have the right to vote", async function (){
            await expect(voting.connect(addr1).vote(votersAddresses[0], 1)).to.be.revertedWith("Voting System: This address does not have right to vote");
        });

        it ("Should can vote", async function (){
            await expect(voting.vote(votersAddresses[0], 1)).not.to.be.reverted;
        });
        

    });

    describe ("Winners", function() {
        it("Can't compute winners, not the owner" , async function() {
            await voting.vote(votersAddresses[0], 1); //addr0
            await voting.connect(addr1).vote(votersAddresses[1], 1); //Addr1
            await voting.connect(addr2).vote(votersAddresses[2], 0); //Addr2
            await voting.connect(addr3).vote(votersAddresses[3], 2); //Addr3
            await voting.connect(addr4).vote(votersAddresses[4], 1); //Addr4
            await voting.connect(addr5).vote(votersAddresses[5], 0); //Addr5
            await voting.connect(addr6).vote(votersAddresses[6], 1); //Addr6

            await expect(voting.connect(addr1).computeWinners()).to.be.revertedWith("Ownable: caller is not the owner");
            
        } );

        it("Can compute winners" , async function() {
            await voting.vote(votersAddresses[0], 2); //addr0
            await voting.connect(addr1).vote(votersAddresses[1], 1); //Addr1
            await voting.connect(addr2).vote(votersAddresses[2], 0); //Addr2
            await voting.connect(addr3).vote(votersAddresses[3], 0); //Addr3
            await voting.connect(addr4).vote(votersAddresses[4], 1); //Addr4
            await voting.connect(addr5).vote(votersAddresses[5], 0); //Addr5
            await voting.connect(addr6).vote(votersAddresses[6], 1); //Addr6

            await expect(voting.computeWinners()).not.to.be.reverted;
            let prop = await voting.getWinningProposals();
            
            expect(prop[0]).to.be.equal(0);
            expect(prop[1]).to.be.equal(1);
            
        } )
    });
    


})