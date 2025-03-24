import ContainersList from "./ContainersList";
console.log("ContainersList:", ContainersList); 

const Home = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <ContainersList />
    </div>
  );
};

export default Home;
