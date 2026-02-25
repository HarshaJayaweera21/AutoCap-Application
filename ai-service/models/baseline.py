from collections import Counter
import torch
import torch.nn as nn
import torchvision.transforms.v2 as T
import torchvision.models as models

class Vocabulary:
    """A class to create a vocabulary builder for captions in the dataset"""
    def __init__(self,freq_threshold=5):
        """Here we are considering the freq_threshold=5 from default : meaning if word appear above 5 times we add it to our vocabulary"""
        self.freq_threshold=freq_threshold

        self.itos={
            0:"<pad>",
            1:"<start>",
            2:"<end>",
            3:"<unk>",
        }

        self.stoi={v:k for k,v in self.itos.items()}

    def __len__(self):
        return len(self.itos)

    def build_vocabulary(self,captions):
        frequencies=Counter()
        idx=4

        for caption in captions:
            for word in caption.split():
                frequencies[word]+=1

                if frequencies[word]==self.freq_threshold:
                    self.stoi[word]=idx
                    self.itos[idx]=word
                    idx+=1

    def numericalize(self,text):
        return [
            self.stoi.get(word,self.stoi["<unk>"])
            for word in text.split()
        ]

toTensor = T.Compose([
    T.Resize((224,224)),
    T.ToImage(),
    T.ToDtype(torch.float32,scale=True),
    T.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225]
    )
])

class EncoderCNN(nn.Module):
  def __init__(self,encoded_img_size=7):
    super().__init__()

    resnet152=models.resnet152(weights=models.ResNet152_Weights.IMAGENET1K_V2)

    # removing avgpool and classifier
    self.backbone=nn.Sequential(*list(resnet152.children())[:-2])

    # adding a adaptive pooling to keep attention grid consistent
    self.adaptive_pool=nn.AdaptiveAvgPool2d(
        (encoded_img_size,encoded_img_size)
        )

    self.enc_dim=2048 # output channels

    for param in self.backbone.parameters():
      param.requires_grad=False

  def forward(self,X):
    """
      Input : (B,3,224,224)
       out: (B,49,2048)
    """
    features=self.backbone(X)

    # features=self.adaptive_pool(features)

    B,C,H,W=features.size()
    features = features.permute(0, 2, 3, 1)
    features = features.view(B, H*W, C)

    return features

class Attention(nn.Module):
  def __init__(self,enc_dim,dec_dim,attn_dim):
    super().__init__()

    self.enc_attn=nn.Linear(enc_dim,attn_dim)
    self.dec_attn=nn.Linear(dec_dim,attn_dim)
    self.full_attn=nn.Linear(attn_dim,1)

    self.relu=nn.ReLU()
    self.softmax=nn.Softmax(dim=1)

  def forward(self,encoder_out,decoder_hidden):
    attn_enc=self.enc_attn(encoder_out)
    attn_dec=self.dec_attn(decoder_hidden).unsqueeze(1)

    energy=self.full_attn(
        self.relu(attn_enc+attn_dec)
    ).squeeze(2)

    alpha=self.softmax(energy)
    context=(encoder_out*alpha.unsqueeze(2)).sum(dim=1)

    return context,alpha

class DecoderRNN(nn.Module):
  def __init__(self,vocab_size,enc_dim=2048,emb_dim=512,dec_dim=512,attn_dim=512,dropout=0.5):
    super().__init__()

    self.vocab_size=vocab_size
    self.enc_dim=enc_dim
    self.dec_dim=dec_dim

    self.embedding=nn.Embedding(vocab_size,emb_dim)
    self.attention=Attention(enc_dim,dec_dim,attn_dim)

    self.lstm=nn.LSTMCell(emb_dim+enc_dim,dec_dim)
    self.init_h=nn.Linear(enc_dim,dec_dim)
    self.init_c=nn.Linear(enc_dim,dec_dim)

    self.fc=nn.Linear(dec_dim,vocab_size)
    self.dropout=nn.Dropout(dropout)

  def init_hid_state(self,encoder_out):
    mean_enc=encoder_out.mean(dim=1)
    h=self.init_h(mean_enc)
    c=self.init_c(mean_enc)
    return h,c

  def forward(self,encoder_out,captions,lengths):
    B=encoder_out.size(0)
    T=captions.size(1)

    embeddings=self.embedding(captions)

    h,c=self.init_hid_state(encoder_out)

    outputs=torch.zeros(B,T,self.vocab_size,device=encoder_out.device)
    alphas=torch.zeros(B,T,encoder_out.size(1),device=encoder_out.device)

    for t in range(T):
      context,alpha=self.attention(encoder_out,h)
      lstm_input=torch.cat([embeddings[:,t,:],context],dim=1)

      h,c=self.lstm(lstm_input,(h,c))
      preds=self.fc(self.dropout(h))

      outputs[:,t,:]=preds
      alphas[:,t,:]=alpha

    return outputs,alphas

@torch.no_grad()
def generate_caption(encoder,decoder,image_tensor,vocab,device,max_length=100):
  encoder.eval()
  decoder.eval()

  image_tensor=image_tensor.unsqueeze(0).to(device)

  encoder_out=encoder(image_tensor)

  h,c=decoder.init_hid_state(encoder_out)

  word=torch.tensor(
      [vocab.stoi["<start>"]],
      device=device
  )

  caption=[]
  alphas=[]

  for _ in range(max_length):
    embedding=decoder.embedding(word)
    context,alpha=decoder.attention(encoder_out,h)

    alphas.append(alpha.cpu())

    lstm_input=torch.cat([embedding,context],dim=1)
    h,c=decoder.lstm(lstm_input,(h,c))

    scores=decoder.fc(h)
    predicted=scores.argmax(dim=1)

    token=vocab.itos[predicted.item()]

    if token=="<end>":
      break

    caption.append(token)
    word=predicted

  return " ".join(caption),alphas
